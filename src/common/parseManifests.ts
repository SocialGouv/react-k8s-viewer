import type { FlowElement, Elements, Node, Edge } from "react-flow-renderer";
import { Position } from "react-flow-renderer";

import type { AnyObject, Manifest, ManifestList } from "../types/types";

import { Volume } from "kubernetes-models/api/core/v1/Volume";
import { Container } from "kubernetes-models/api/core/v1/Container";
import { IIoK8sApiCoreV1EnvFromSource } from "kubernetes-models/_definitions/IoK8sApiCoreV1EnvFromSource";
import { IIoK8sApiCoreV1EnvVar } from "kubernetes-models/_definitions/IoK8sApiCoreV1EnvVar";
import { IngressRule } from "kubernetes-models/networking.k8s.io/v1beta1/IngressRule";
import { IngressTLS } from "kubernetes-models/networking.k8s.io/v1beta1/IngressTLS";

const defaultPositions = {
  position: { x: 0, y: 0 },
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

const getFlowNode = (manifest: Manifest) => ({
  id: `${manifest.kind}-${manifest?.metadata?.namespace || ""}-${
    manifest?.metadata?.name || ""
  }`,
  ...defaultPositions,
});

const createVolumeNode = (manifest: Manifest, volume: AnyObject): Node => {
  const volumeName =
    (volume.azureFile && volume.azureFile.shareName) ||
    (volume.configMap && volume.configMap.name) ||
    volume.name;

  const volumeId = `volume-${manifest?.metadata?.namespace}-${volumeName}`;
  return {
    id: volumeId,
    ...defaultPositions,
    data: { label: `💾 ${volumeName}`, ...volume },
  };
};

const getManifestNodes = (manifest: Manifest): Node[] => {
  return (
    (manifest.spec.template.spec.volumes &&
      manifest.spec.template.spec.volumes
        .filter((volume: Volume) => !volume.name.match(/^default-token-/))
        .map((volume: Volume) => createVolumeNode(manifest, volume))) ||
    []
  );
};

const manifestsTypes = {
  Ingress: (manifest: Manifest): Node[] => [
    {
      ...getFlowNode(manifest),
      type: "ingress",
      data: {
        label:
          manifest.spec.rules &&
          manifest.spec.rules
            .map((rule: AnyObject) => `🌍 ${rule.host}`)
            .join("<br>"),
        manifest,
      },
    },
  ],
  Service: (manifest: Manifest): Node[] => [
    {
      ...getFlowNode(manifest),
      data: {
        label: `🚦 ${manifest.kind} ${manifest?.metadata?.name}`,
        manifest,
      },
    },
  ],
  Secret: (manifest: Manifest): Node[] => [
    {
      ...getFlowNode(manifest),
      type: "output",
      data: {
        label: `🔓 ${manifest?.metadata?.name}`,
        manifest,
      },
    },
  ],
  SealedSecret: (manifest: Manifest): Node[] => [
    {
      ...getFlowNode(manifest),
      type: "input",
      data: {
        label: `🔐 ${manifest?.metadata?.name}`,
        manifest,
      },
    },
    {
      ...manifestsTypes.Secret({ ...manifest, kind: "Secret" })[0],
    },
  ],
  ConfigMap: (manifest: Manifest): Node[] => [
    {
      ...getFlowNode(manifest),
      type: "output",
      data: {
        label: `🗒 ${manifest?.metadata?.name}`,
        manifest,
      },
    },
  ],
  ServiceMonitor: (manifest: Manifest): Node[] => [
    {
      ...getFlowNode(manifest),
      data: {
        label: `📊 ${manifest?.metadata?.name}`,
        manifest,
      },
    },
  ],
  Deployment: (manifest: Manifest): Node[] => {
    const volumes = getManifestNodes(manifest);
    const replicas = manifest.spec.replicas || 1;
    return [
      ...volumes,
      ...Array.from({ length: replicas }, (k, v) => {
        const node = getFlowNode(manifest);
        return {
          ...node,
          id: node.id + `-${v}`,
          data: {
            label: `📦 ${manifest?.metadata?.name}`,
            manifest,
          },
        };
      }),
    ];
  },
  CronJob: (manifest: Manifest): Node[] => {
    const volumes = getManifestNodes(manifest);
    return [
      ...volumes,
      {
        ...getFlowNode(manifest),
        data: { label: `⏳ ${manifest?.metadata?.name}`, manifest },
      },
    ];
  },
  Job: (manifest: Manifest): Node[] => {
    const volumes = getManifestNodes(manifest);
    return [
      ...volumes,
      {
        ...getFlowNode(manifest),
        data: { label: `⚡️ ${manifest?.metadata?.name}`, manifest },
      },
    ];
  },
} as AnyObject;

const createEdge = (
  source: FlowElement,
  target: FlowElement,
  opts = {}
): Edge | null => {
  if (!source) {
    console.log("createEdge.error source", source, opts);
    return null;
  }
  if (!target) {
    console.log("createEdge.error target", target, opts);
    return null;
  }
  return {
    id: `edge-${source.id}-${target.id}`,
    source: source.id,
    target: target.id,
    ...opts,
  };
};

const getElements = (elements: Elements, filters: AnyObject): Elements => {
  const filtered = elements.filter((e) => {
    const isValid = e && e.data && e.data.manifest;
    if (!isValid) {
      return false;
    }
    const isKind = !filters.kind || e.data.manifest.kind === filters.kind;
    const isName =
      !filters.name || e.data.manifest?.metadata?.name === filters.name;

    return isKind && isName;
  });
  return filtered;
};

const getVolume = (
  elements: Elements,
  namespace: string,
  volume: Volume
): Node | Edge | undefined => {
  const volumeName =
    (volume.azureFile && volume.azureFile.shareName) ||
    (volume.configMap && volume.configMap.name) ||
    volume.name;

  const volumeId = `volume-${namespace}-${volumeName}`;
  return elements.find((e: any) => e.id && e.id === volumeId);
};

export const parseManifests = (
  manifests: ManifestList | Manifest[]
): Elements => {
  const elements = [] as Elements;
  let allManifests = [];

  // handle different inputs
  if (Array.isArray(manifests)) {
    if (manifests[0].items) {
      allManifests = manifests[0].items;
    } else {
      allManifests = manifests;
    }
  } else if (manifests.items) {
    allManifests = manifests.items;
  }

  // create all Nodes elements
  allManifests.forEach((manifest: Manifest) => {
    const definition = manifestsTypes[manifest.kind] as Function;
    if (definition) {
      const createdNodes = definition(manifest);
      createdNodes.filter(Boolean).forEach((node: Node) => {
        //@ts-expect-error
        if (!elements.find((n: Node) => n.id === node.id)) {
          elements.push(node);
        }
      });
    }
  });

  if (allManifests.find((m: Manifest) => m.kind === "Ingress")) {
    const internetNode = {
      ...defaultPositions,
      id: `Internet`,
      type: "input",
      data: {
        label: `🌥 Internet`,
      },
    } as Node;

    elements.push(internetNode);

    allManifests
      .filter(
        (manifest: Manifest) =>
          manifest.kind === "Ingress" && manifest.spec.rules
      )
      .filter((manifest: Manifest) => manifest.spec.rules[0].host)
      .forEach((manifest: Manifest) => {
        const ingressNode = getElements(elements, {
          kind: "Ingress",
          name: manifest?.metadata?.name,
        })[0];

        // internet to ingress edge
        const edge = createEdge(internetNode, ingressNode, {
          label: manifest.spec.tls && manifest.spec.tls.length ? "TLS" : "",
        });

        if (edge) {
          elements.push(edge);
        }

        const isValidRule = (rule: IngressRule) =>
          rule.http &&
          rule.http.paths.length &&
          rule.http.paths[0].backend.serviceName;

        // ingress to services edge
        manifest.spec.rules.filter(isValidRule).forEach((rule: IngressRule) => {
          if (rule.http && rule.http.paths && rule.http.paths.length) {
            rule.http.paths.forEach((path) => {
              const name = path.backend.serviceName;
              const serviceNode = getElements(elements, {
                kind: "Service",
                name,
              })[0];
              const edge = createEdge(ingressNode, serviceNode, {
                label: path.path && `'"${path.path}"'`,
              });
              if (edge) {
                elements.push(edge);
              }
            });
          }
        });

        // ingress to TLS secret edge
        manifest.spec.tls &&
          manifest.spec.tls.forEach((tls: IngressTLS) => {
            if (tls.secretName) {
              const secretNode = getElements(elements, {
                kind: "Secret",
                name: tls.secretName,
              })[0];
              const edge = createEdge(ingressNode, secretNode, {
                defaultTargetLabel: tls.secretName,
              });
              if (edge) {
                elements.push(edge);
              }
            }
          });
      });

    // TODO: 2eme passe pour gérer redirections
    // allManifests
    //   .filter((manifest: Manifest) => manifest.kind === "Ingress")
    //   .filter((manifest: Manifest) => manifest.spec.rules[0].host)
    //   .filter(
    //     (manifest: Manifest) =>
    //       manifest.metadata.annotations[
    //         "nginx.ingress.kubernetes.io/permanent-redirect"
    //       ]
    //   )
    //   .forEach((manifest: Manifest) => {
    //     manifest.spec.rules.forEach((rule: any) => {
    //       const host = manifest.metadata.annotations[
    //         "nginx.ingress.kubernetes.io/permanent-redirect"
    //       ].replace(/^https?:\/\/([^/$]*).*/i, "$1");
    //       elements.push({
    //         id: `edge-${manifest.kind}-${manifest?.metadata?.namespace}-${manifest?.metadata?.name}-${rule.host}`,
    //         source: `${manifest.kind}-${rule.host}`,
    //         target: `Ingress-` + host,
    //         defaultTargetLabel: host,
    //         animated: true,
    //         label: "301",
    //       });
    //     });
    //   });
  }

  allManifests
    .filter((manifest: Manifest) => manifest.kind === "Service")
    .forEach((manifest: Manifest) => {
      // service to deployment edge
      const targetDeploymentName =
        manifest.spec.selector.app ||
        manifest.spec.selector["app.kubernetes.io/instance"] +
          "-" +
          manifest.spec.selector["app.kubernetes.io/name"];

      const serviceNode = getElements(elements, {
        kind: "Service",
        name: manifest?.metadata?.name,
      })[0];

      const deploymentNodes = getElements(elements, {
        kind: "Deployment",
        name: targetDeploymentName,
      });

      deploymentNodes.forEach((deploymentNode) => {
        const edge = createEdge(serviceNode, deploymentNode, {
          // defaultTargetLabel: rule.secretName,
          animated: true,
        });
        if (edge) {
          elements.push(edge);
        }
      });
    });

  allManifests
    .filter((manifest: Manifest) => manifest.kind === "SealedSecret")
    .forEach((manifest: Manifest) => {
      const secretNode = getElements(elements, {
        kind: "Secret",
        name: manifest?.metadata?.name,
      })[0];
      const sealedSecretNode = getElements(elements, {
        kind: "SealedSecret",
        name: manifest?.metadata?.name,
      })[0];
      const edge = createEdge(sealedSecretNode, secretNode);
      if (edge) {
        elements.push(edge);
      }
    });

  allManifests
    .filter((manifest: Manifest) => manifest.kind === "ServiceMonitor")
    .forEach((manifest: Manifest) => {
      const serviceMonitorNode = getElements(elements, {
        kind: "ServiceMonitor",
        name: manifest?.metadata?.name,
      })[0];
      const serviceNode = getElements(elements, {
        kind: "Service",
        name: manifest.spec.selector.matchLabels.app,
      })[0];
      const edge = createEdge(serviceMonitorNode, serviceNode, {
        animated: true,
      });
      if (edge) {
        elements.push(edge);
      }
    });

  allManifests
    .filter(
      (manifest: Manifest) =>
        manifest.kind === "Job" ||
        manifest.kind === "CronJob" ||
        manifest.kind === "Deployment"
    )
    .forEach((manifest: Manifest) => {
      const manifestNodes = getElements(elements, {
        kind: manifest.kind,
        name: manifest?.metadata?.name,
      });

      manifestNodes.forEach((manifestNode) => {
        if (manifest.spec.template.spec.imagePullSecrets) {
          manifest.spec.template.spec.imagePullSecrets.forEach(
            (pullSecret: AnyObject) => {
              const secretNode = getElements(elements, {
                kind: "Secret",
                name: pullSecret.name,
              })[0];
              const edge = createEdge(manifestNode, secretNode, {
                type: "smoothstep",
                data: {
                  label: `Secret ${pullSecret.name}`,
                },
              });
              if (edge) {
                elements.push(edge);
              }
            }
          );
        }

        manifest.spec.template.spec.volumes &&
          manifest.spec.template.spec.volumes
            .filter((volume: Volume) => !volume.name.match(/^default-token-/))
            .forEach((volume: Volume) => {
              const volumeNode = getVolume(
                elements,
                manifest?.metadata?.namespace,
                volume
              );
              if (volumeNode) {
                const edge = createEdge(manifestNode, volumeNode, {
                  type: "smoothstep",
                });
                if (edge) {
                  elements.push(edge);
                }
                if (volume.configMap) {
                  const configMapNode = getElements(elements, {
                    kind: "ConfigMap",
                    name: volume.configMap.name,
                  })[0];
                  const edge = createEdge(volumeNode, configMapNode, {
                    type: "smoothstep",
                    data: {
                      label: `ConfigMap ${volume.configMap.name}`,
                      ...volume,
                    },
                  });
                  if (edge) {
                    elements.push(edge);
                  }
                }
                if (volume.azureFile) {
                  const secretNode = getElements(elements, {
                    kind: "Secret",
                    name: volume.azureFile.secretName,
                  })[0];
                  const edge = createEdge(volumeNode, secretNode, {
                    type: "smoothstep",
                    data: {
                      label: `Secret ${volume.azureFile.secretName}`,
                      ...volume,
                    },
                  });
                  if (edge) {
                    elements.push(edge);
                  }
                }
              }
            });

        manifest.spec.template.spec.containers.forEach(
          (container: Container) => {
            if (container.envFrom) {
              container.envFrom.forEach(
                (envFrom: IIoK8sApiCoreV1EnvFromSource) => {
                  if (envFrom.secretRef) {
                    const secretNode = getElements(elements, {
                      kind: "Secret",
                      name: envFrom.secretRef.name,
                    })[0];
                    const edge = createEdge(manifestNode, secretNode, {
                      type: "smoothstep",
                      data: {
                        label: `Secret ${envFrom.secretRef.name}`,
                      },
                    });
                    if (edge) {
                      elements.push(edge);
                    }
                  }
                  if (envFrom.configMapRef) {
                    const configMapNode = getElements(elements, {
                      kind: "ConfigMap",
                      name: envFrom.configMapRef.name,
                    })[0];
                    const edge = createEdge(manifestNode, configMapNode, {
                      type: "smoothstep",
                      data: {
                        label: `ConfigMap ${envFrom.configMapRef.name}`,
                      },
                    });
                    if (edge) {
                      elements.push(edge);
                    }
                  }
                }
              );
            }
            if (container.env) {
              container.env.forEach((env: IIoK8sApiCoreV1EnvVar) => {
                if (env.valueFrom) {
                  if (env.valueFrom.secretKeyRef) {
                    const secretNode = getElements(elements, {
                      kind: "Secret",
                      name: env.valueFrom.secretKeyRef.name,
                    })[0];
                    const edge = createEdge(manifestNode, secretNode, {
                      type: "smoothstep",
                      data: {
                        label: `Secret ${env.valueFrom.secretKeyRef.name}`,
                      },
                    });
                    if (edge) {
                      elements.push(edge);
                    }
                  } else if (env.valueFrom.configMapKeyRef) {
                    const configMapNode = getElements(elements, {
                      kind: "Secret",
                      name: env.valueFrom.configMapKeyRef.name,
                    })[0];
                    const edge = createEdge(manifestNode, configMapNode, {
                      type: "smoothstep",
                      data: {
                        label: `ConfigMap ${env.valueFrom.configMapKeyRef.name}`,
                      },
                    });
                    if (edge) {
                      elements.push(edge);
                    }
                  }
                }
              });
            }
          }
        );
      });
    });

  // todo: create placeholders for missing nodes
  // ensure not found elements are explicit
  /* elements.forEach((element) => {
    if (element && element.target) {
      if (!elements.find((el) => el.id === element.target)) {
        // target not found
        elements.push({
          id: element.target,
          data: {
            label:
              (element.data && element.data.label) ||
              element.defaultTargetLabel ||
              "",
          },
          sourcePosition: "right",
          targetPosition: "left",
          style: styles.error,
        });
      }
      if (!elements.find((el) => el.id === element.source)) {
        // source not found
        elements.push({
          id: element.source,
          data: {
            label:
              (element.data && element.data.label) ||
              element.defautlSourceLabel ||
              "",
          },
          sourcePosition: "right",
          targetPosition: "left",
          style: styles.error,
        });
      }
    }
  });
  */

  return elements.filter(Boolean);
};
