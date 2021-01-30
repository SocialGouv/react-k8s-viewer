const styles = {
  Deployments: "#0f4c75",
  Ingress: "#1e9e99",
  Job: "#333",
  error: { backgroundColor: "#ff7575", color: "#fff" },
};

interface Manifest {
  kind: string;
  [U: string]: any;
}

interface AnyObject {
  [U: string]: any;
}

const defaultPositions = {
  sourcePosition: "right",
  targetPosition: "left",
};

const baseManifest = (manifest: AnyObject) => ({
  id: `${manifest.kind}-${manifest.metadata.namespace || ""}-${
    manifest.metadata.name
  }`,
  ...defaultPositions,
});

const createVolumeElement = (manifest: Manifest, volume: AnyObject) => {
  const volumeName =
    (volume.azureFile && volume.azureFile.shareName) ||
    (volume.configMap && volume.configMap.name) ||
    volume.name;

  const volumeId = `volume-${manifest.metadata.namespace}-${volumeName}`;
  return {
    id: volumeId,
    ...defaultPositions,
    data: { label: `💾 ${volumeName}`, ...volume },
  };
};

const getManifestVolumes = (manifest: Manifest) => {
  return (
    (manifest.spec.template.spec.volumes &&
      manifest.spec.template.spec.volumes
        .filter((volume: any) => !volume.name.match(/^default-token-/))
        .map((volume: any) => createVolumeElement(manifest, volume))) ||
    []
  );
};

const manifestsTypes = {
  Ingress: (manifest: Manifest): AnyObject[] => [
    {
      ...baseManifest(manifest),
      type: "ingress",
      data: {
        label: manifest.spec.rules
          .map((rule: AnyObject) => `🌍 ${rule.host}`)
          .join("<br>"),
        manifest,
      },
    },
  ],
  Service: (manifest: Manifest): AnyObject[] => [
    {
      ...baseManifest(manifest),
      data: {
        label: `🚦 ${manifest.kind} ${manifest.metadata.name}`,
        manifest,
      },
    },
  ],
  Secret: (manifest: Manifest): AnyObject[] => [
    {
      ...baseManifest(manifest),
      type: "output",
      data: {
        label: `🔓 ${manifest.metadata.name}`,
        manifest,
      },
    },
  ],
  SealedSecret: (manifest: Manifest): AnyObject[] => [
    {
      ...baseManifest(manifest),
      type: "input",
      data: {
        label: `🔐 ${manifest.metadata.name}`,
        manifest,
      },
    },
  ],
  ConfigMap: (manifest: Manifest): AnyObject[] => [
    {
      ...baseManifest(manifest),
      type: "output",
      data: {
        label: `🗒 ${manifest.metadata.name}`,
        manifest,
      },
    },
  ],
  ServiceMonitor: (manifest: Manifest): AnyObject[] => [
    {
      ...baseManifest(manifest),
      data: {
        label: `📊 ${manifest.metadata.name}`,
        manifest,
      },
    },
  ],
  Deployment: (manifest: Manifest): AnyObject[] => {
    const volumes = getManifestVolumes(manifest);
    const replicas = manifest.spec.replicas || 1;
    return [
      ...volumes,
      ...Array.from({ length: replicas }, (k, v) => {
        return {
          ...baseManifest(manifest),
          id: baseManifest(manifest).id + `-${v}`,
          data: {
            label: `📦 ${manifest.metadata.name}`,
            manifest,
          },
        };
      }),
    ];
  },
  CronJob: (manifest: Manifest): AnyObject[] => {
    const volumes = getManifestVolumes(manifest);
    return [
      ...volumes,
      {
        ...baseManifest(manifest),
        data: { label: `⏳ ${manifest.metadata.name}`, manifest },
      },
    ];
  },
  Job: (manifest: Manifest): AnyObject[] => {
    const volumes = getManifestVolumes(manifest);
    return [
      ...volumes,
      {
        ...baseManifest(manifest),
        data: { label: `⚡️ ${manifest.metadata.name}`, manifest },
      },
    ];
  },
} as AnyObject;

const createEdge = (source: any, target: any, opts = {}) => {
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

const getElements = (elements: AnyObject[], filters: AnyObject) => {
  const filtered = elements.filter((e: any) => {
    const isValid = e && e.data && e.data.manifest;
    if (!isValid) {
      return false;
    }
    const isKind = !filters.kind || e.data.manifest.kind === filters.kind;
    const isName =
      !filters.name || e.data.manifest.metadata.name === filters.name;

    return isKind && isName;
  });
  return filtered;
};

const getVolume = (
  elements: AnyObject[],
  namespace: string,
  volume: AnyObject
) => {
  const volumeName =
    (volume.azureFile && volume.azureFile.shareName) ||
    (volume.configMap && volume.configMap.name) ||
    volume.name;

  const volumeId = `volume-${namespace}-${volumeName}`;
  return elements.find((e: AnyObject) => e.id === volumeId);
};

export const parseManifests = (manifests: any): any[] => {
  const elements = [] as any;

  const allManifests =
    (Array.isArray(manifests) && manifests[0].items) ||
    manifests.items ||
    manifests;

  // create all Nodes elements
  allManifests.forEach((manifest: Manifest) => {
    const definition = manifestsTypes[manifest.kind];
    if (definition) {
      const createdNodes = definition(manifest);
      createdNodes.filter(Boolean).forEach((node: AnyObject) => {
        if (!elements.find((e: AnyObject) => e.id === node.id)) {
          elements.push(node);
        }
      });
    }
  });

  if (allManifests.find((m: any) => m.kind === "Ingress")) {
    const internetNode = {
      ...defaultPositions,
      id: `Internet`,
      position: "top",
      type: "input",
      data: {
        label: `🌥 Internet`,
      },
    };

    elements.push(internetNode);

    allManifests
      .filter((manifest: Manifest) => manifest.kind === "Ingress")
      .filter((manifest: Manifest) => manifest.spec.rules[0].host)
      .forEach((manifest: Manifest) => {
        const ingressNode = getElements(elements, {
          kind: "Ingress",
          name: manifest.metadata.name,
        })[0];

        // internet to ingress edge
        const edge = createEdge(internetNode, ingressNode, {
          label: manifest.spec.tls && manifest.spec.tls.length ? "TLS" : "",
        });
        elements.push(edge);

        const isValidRule = (rule: AnyObject) =>
          rule.http &&
          rule.http.paths.length &&
          rule.http.paths[0].backend.serviceName;

        // ingress to services edge
        manifest.spec.rules.filter(isValidRule).forEach((rule: AnyObject) => {
          const name = rule.http.paths[0].backend.serviceName;
          const serviceNode = getElements(elements, {
            kind: "Service",
            name,
          })[0];
          const edge = createEdge(ingressNode, serviceNode);
          elements.push(edge);
        });

        // ingress to TLS secret edge
        manifest.spec.tls &&
          manifest.spec.tls.forEach((rule: any) => {
            if (rule.secretName) {
              const secretNode = getElements(elements, {
                kind: "Secret",
                name: rule.secretName,
              })[0];
              const edge = createEdge(ingressNode, secretNode, {
                defaultTargetLabel: rule.secretName,
              });
              elements.push(edge);
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
    //         id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-${rule.host}`,
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
        name: manifest.metadata.name,
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

        elements.push(edge);
      });
    });

  allManifests
    .filter((manifest: Manifest) => manifest.kind === "SealedSecret")
    .forEach((manifest: Manifest) => {
      const secretNode = getElements(elements, {
        kind: "Secret",
        name: manifest.metadata.name,
      })[0];
      const sealedSecretNode = getElements(elements, {
        kind: "SealedSecret",
        name: manifest.metadata.name,
      })[0];
      const edge = createEdge(sealedSecretNode, secretNode);
      elements.push(edge);
    });

  allManifests
    .filter((manifest: Manifest) => manifest.kind === "ServiceMonitor")
    .forEach((manifest: Manifest) => {
      const serviceMonitorNode = getElements(elements, {
        kind: "ServiceMonitor",
        name: manifest.metadata.name,
      })[0];
      const serviceNode = getElements(elements, {
        kind: "Service",
        name: manifest.spec.selector.matchLabels.app,
      })[0];
      const edge = createEdge(serviceMonitorNode, serviceNode, {
        animated: true,
      });
      elements.push(edge);
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
        name: manifest.metadata.name,
      });

      manifestNodes.forEach((manifestNode) => {
        if (manifest.spec.template.spec.imagePullSecrets) {
          manifest.spec.template.spec.imagePullSecrets.forEach(
            (pullSecret: any) => {
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
              elements.push(edge);
            }
          );
        }

        manifest.spec.template.spec.volumes &&
          manifest.spec.template.spec.volumes
            .filter((volume: any) => !volume.name.match(/^default-token-/))
            .forEach((volume: any) => {
              const volumeNode = getVolume(
                elements,
                manifest.metadata.namespace,
                volume
              );

              const edge = createEdge(manifestNode, volumeNode, {
                type: "smoothstep",
              });
              elements.push(edge);

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
                elements.push(edge);
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
                elements.push(edge);
              }
            });

        manifest.spec.template.spec.containers.forEach((container: any) => {
          if (container.envFrom) {
            container.envFrom.forEach((envFrom: any) => {
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
                elements.push(edge);
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
                elements.push(edge);
              }
            });
          }
          if (container.env) {
            container.env.forEach((env: any) => {
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
                  elements.push(edge);
                } else if (env.valueFrom.configMapRef) {
                  const configMapNode = getElements(elements, {
                    kind: "Secret",
                    name: env.valueFrom.configMapRef.name,
                  })[0];
                  const edge = createEdge(manifestNode, configMapNode, {
                    type: "smoothstep",
                    data: {
                      label: `ConfigMap ${env.valueFrom.configMapRef.name}`,
                    },
                  });
                  elements.push(edge);
                }
              }
            });
          }
        });
      });
    });

  // ensure not found elements are explicit
  elements.forEach((element: any) => {
    if (element && element.target) {
      if (!elements.find((el: any) => el.id === element.target)) {
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
      if (!elements.find((el: any) => el.id === element.source)) {
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

  return elements.filter(Boolean);
};
