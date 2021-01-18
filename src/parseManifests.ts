const styles = {
  Deployments: "#0f4c75",
  Ingress: "#1e9e99",
  Job: "#333",
  error: { backgroundColor: "#ff7575", color: "#fff" },
};

// Ingress
interface Manifest {
  kind: string;
  [U: string]: any;
}

type CreateIngressNodeProps = {
  host: string;
};

const createIngressNode = ({ host }: CreateIngressNodeProps) => ({
  id: `Ingress-${host}`,
  sourcePosition: "right",
  targetPosition: "left",
  data: {
    label: `🌍 ${host}`,
  },
});

const createEdge = (source: any, target: any, opts = {}) => ({
  id: `edge-${source.id}-${target.id}`,
  source: source.id,
  target: target.id,
  ...opts,
});

/*

Ingress

*/
export const parseManifests = (manifests: any): any[] => {
  const elements = [] as any;

  const allManifests =
    (Array.isArray(manifests) && manifests[0].items) ||
    manifests.items ||
    manifests;

  if (allManifests.find((m: any) => m.kind === "Ingress")) {
    const internetNode = {
      id: `Internet`,
      sourcePosition: "right",
      targetPosition: "left",
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
        // Create a node for each host declared in ingress rules
        manifest.spec.rules.forEach((rule: any) => {
          const ingressNode = createIngressNode({ host: rule.host });

          const inEdge = createEdge(internetNode, ingressNode, {
            label: manifest.spec.tls.length ? "TLS" : "",
          });

          elements.push(ingressNode);
          elements.push(inEdge);

          // elements.push({
          //   id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-Internet`,
          //   source: `Internet`,
          //   target: `${manifest.kind}-${rule.host}`,
          //   label: manifest.spec.tls.length ? "TLS" : "",
          // });

          if (rule.http) {
            // edge entre le host et le service
            elements.push({
              id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-http-${rule.http.paths[0].backend.serviceName}`,
              source: `${manifest.kind}-${rule.host}`,
              target: `Service-${manifest.metadata.namespace}-${rule.http.paths[0].backend.serviceName}`,
            });
          }
        });
        // edge entre le host et le secret tls
        manifest.spec.tls.forEach((rule: any) => {
          if (rule.secretName) {
            rule.hosts.forEach((host: string) => {
              elements.push({
                id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-tls-${host}`,
                source: `${manifest.kind}-${host}`,
                target: `Secret-${manifest.metadata.namespace}-${rule.secretName}`,
                defaultTargetLabel: rule.secretName,
              });
              elements.push({
                id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-Internet-${host}`,
                source: `Internet`,
                target: `${manifest.kind}-${host}`,
                label: manifest.spec.tls.length ? "TLS" : "",
              });
            });
          }
        });
      });

    // 2eme passe pour gérer redirections
    allManifests
      .filter((manifest: Manifest) => manifest.kind === "Ingress")
      .filter((manifest: Manifest) => manifest.spec.rules[0].host)
      .filter(
        (manifest: Manifest) =>
          manifest.metadata.annotations[
            "nginx.ingress.kubernetes.io/permanent-redirect"
          ]
      )
      .forEach((manifest: Manifest) => {
        manifest.spec.rules.forEach((rule: any) => {
          const host = manifest.metadata.annotations[
            "nginx.ingress.kubernetes.io/permanent-redirect"
          ].replace(/^https?:\/\/([^/$]*).*/i, "$1");
          elements.push({
            id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-${rule.host}`,
            source: `${manifest.kind}-${rule.host}`,
            target: `Ingress-` + host,
            defaultTargetLabel: host,
            animated: true,
            label: "301",
          });
        });
      });
  }

  allManifests
    .filter((manifest: Manifest) => manifest.kind === "Service")
    .forEach((manifest: Manifest) => {
      elements.push({
        id: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        data: { label: `🚦 ${manifest.kind} ${manifest.metadata.name}` },
        sourcePosition: "right",
        targetPosition: "left",
      });

      const targetDeploymentName =
        manifest.spec.selector.app ||
        manifest.spec.selector["app.kubernetes.io/instance"] +
          "-" +
          manifest.spec.selector["app.kubernetes.io/name"];

      elements.push({
        id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-${manifest.spec.selector.app}`,
        source: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        target: `Deployment-${manifest.metadata.namespace}-${targetDeploymentName}`,
        animated: true,
      });
    });

  elements.push(
    ...allManifests
      .filter((manifest: Manifest) => manifest.kind === "Secret")
      .map((manifest: Manifest) => ({
        id: `Secret-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        sourcePosition: "right",
        targetPosition: "left",
        type: "output",
        align: "left",
        data: {
          label: `🔓 ${manifest.metadata.name}`,
        },
      }))
  );

  allManifests
    .filter((manifest: Manifest) => manifest.kind === "SealedSecret")
    .forEach((manifest: Manifest) => {
      elements.push({
        id: `SealedSecret-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        sourcePosition: "right",
        targetPosition: "left",
        type: "input",
        align: "left",
        data: {
          label: `🔐 ${manifest.metadata.name}`,
        },
      });
      elements.push({
        id: `edge-SealedSecret-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        source: `SealedSecret-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        target: `Secret-${manifest.metadata.namespace}-${manifest.metadata.name}`,
      });
    });

  elements.push(
    ...allManifests
      .filter((manifest: Manifest) => manifest.kind === "ConfigMap")
      .map((manifest: Manifest) => ({
        id: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        sourcePosition: "right",
        type: "output",
        targetPosition: "left",
        data: {
          label: `🗒 ${manifest.metadata.name}`,
        },
      }))
  );

  allManifests
    .filter((manifest: Manifest) => manifest.kind === "ServiceMonitor")
    .forEach((manifest: Manifest) => {
      elements.push({
        id: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        sourcePosition: "right",
        targetPosition: "left",
        data: {
          label: `📊 ${manifest.metadata.name}`,
        },
      });

      elements.push({
        id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        target: `Service-${manifest.metadata.namespace}-${manifest.spec.selector.matchLabels.app}`,
        source: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        animated: true,
      });
    });

  allManifests
    .filter(
      (manifest: Manifest) =>
        manifest.kind === "Job" || manifest.kind === "CronJob"
    )
    .forEach((manifest: Manifest) => {
      const icon = manifest.kind === "CronJob" ? "⏳" : "⚡️";
      elements.push({
        id: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        data: { label: `${icon} ${manifest.metadata.name}` },
        sourcePosition: "right",
        targetPosition: "left",
      });

      manifest.spec.template.spec.volumes &&
        manifest.spec.template.spec.volumes
          .filter((volume: any) => !volume.name.match(/^default-token-/))
          .forEach((volume: any) => {
            console.log("volume", volume);
            const volumeName =
              (volume.azureFile && volume.azureFile.shareName) ||
              (volume.configMap && volume.configMap.name) ||
              volume.name;

            const volumeId = `volume-${manifest.metadata.namespace}-${volumeName}`;
            if (!elements.find((e: any) => e.id === volumeId)) {
              elements.push({
                id: volumeId,
                sourcePosition: "right",
                targetPosition: "left",
                //source: `Deployment-${manifest.metadata.namespace}-${manifest.metadata.name}`,
                //target: `Secret-${manifest.metadata.namespace}-${envFrom.secretRef.name}`,
                // animated: false,
                // type: "smoothstep",
                data: { label: `💾 ${volumeName}`, ...volume },
              });
            }
            elements.push({
              id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-volume-${volume.name}`,
              source: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
              target: volumeId,
              animated: false,
              type: "smoothstep",
              data: { label: `💾 ${volume.name}`, ...volume },
            });
            if (volume.configMap) {
              elements.push({
                id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-volume-${volume.name}-${volume.configMap.name}`,
                source: volumeId,
                target: `ConfigMap-${manifest.metadata.namespace}-${volume.configMap.name}`,
                animated: false,
                type: "smoothstep",
                data: {
                  label: `configmap ${volume.configMap.name}`,
                  ...volume,
                },
              });
            }
            if (volume.azureFile) {
              elements.push({
                id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-volume-${volume.name}-${volume.azureFile.secretName}`,
                source: volumeId,
                target: `Secret-${manifest.metadata.namespace}-${volume.azureFile.secretName}`,
                animated: false,
                type: "smoothstep",
                data: {
                  label: `Secret ${volume.azureFile.secretName}`,
                  ...volume,
                },
              });
            }
          });

      manifest.spec.template.spec.containers.forEach((container: any) => {
        if (container.envFrom) {
          container.envFrom.forEach((envFrom: any) => {
            if (envFrom.secretRef) {
              elements.push({
                id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${envFrom.secretRef.name}`,
                source: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
                target: `Secret-${manifest.metadata.namespace}-${envFrom.secretRef.name}`,
                animated: true,
                data: { label: `Secret ${envFrom.secretRef.name}` },
              });
            }
            if (envFrom.configMapRef) {
              elements.push({
                id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${envFrom.configMapRef.name}`,
                source: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
                target: `ConfigMap-${manifest.metadata.namespace}-${envFrom.configMapRef.name}`,
                animated: true,
                data: { label: `ConfigMap ${envFrom.configMapRef.name}` },
              });
            }
          });
        }
      });
    });

  allManifests
    .filter((manifest: Manifest) => manifest.kind === "Deployment")
    .forEach((manifest: Manifest) => {
      elements.push({
        id: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
        data: { label: `📦 ${manifest.metadata.name}` },
        sourcePosition: "right",
        targetPosition: "left",
      });
      if (manifest.spec.template.spec.imagePullSecrets) {
        manifest.spec.template.spec.imagePullSecrets.forEach(
          (pullSecret: any) => {
            elements.push({
              id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-${pullSecret.name}`,
              source: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
              target: `Secret-${manifest.metadata.namespace}-${pullSecret.name}`,
              animated: false,
              type: "smoothstep",
              data: { label: `Secret ${pullSecret.name}` },
            });
          }
        );
      }
      manifest.spec.template.spec.volumes &&
        manifest.spec.template.spec.volumes
          .filter((volume: any) => !volume.name.match(/^default-token-/))
          .forEach((volume: any) => {
            console.log("volume", volume);
            const volumeName =
              (volume.azureFile && volume.azureFile.shareName) ||
              (volume.configMap && volume.configMap.name) ||
              volume.name;

            const volumeId = `volume-${manifest.metadata.namespace}-${volumeName}`;
            if (!elements.find((e: any) => e.id === volumeId)) {
              elements.push({
                id: volumeId,
                sourcePosition: "right",
                targetPosition: "left",
                //source: `Deployment-${manifest.metadata.namespace}-${manifest.metadata.name}`,
                //target: `Secret-${manifest.metadata.namespace}-${envFrom.secretRef.name}`,
                // animated: false,
                // type: "smoothstep",
                data: { label: `💾 ${volumeName}`, ...volume },
              });
            }
            elements.push({
              id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-volume-${volume.name}`,
              source: `${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}`,
              target: volumeId,
              animated: false,
              type: "smoothstep",
              data: { label: `💾 ${volume.name}`, ...volume },
            });
            if (volume.configMap) {
              elements.push({
                id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-volume-${volume.name}-${volume.configMap.name}`,
                source: volumeId,
                target: `ConfigMap-${manifest.metadata.namespace}-${volume.configMap.name}`,
                animated: false,
                type: "smoothstep",
                data: {
                  label: `configmap ${volume.configMap.name}`,
                  ...volume,
                },
              });
            }
            if (volume.azureFile) {
              elements.push({
                id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-volume-${volume.name}-${volume.azureFile.secretName}`,
                source: volumeId,
                target: `Secret-${manifest.metadata.namespace}-${volume.azureFile.secretName}`,
                animated: false,
                type: "smoothstep",
                data: {
                  label: `Secret ${volume.azureFile.secretName}`,
                  ...volume,
                },
              });
            }
          });

      manifest.spec.template.spec.containers.forEach((container: any) => {
        if (container.env) {
          container.env.forEach((env: any) => {
            if (env.valueFrom) {
              if (env.valueFrom.secretKeyRef) {
                // add secret + link
                elements.push({
                  id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-${container.name}-env-${env.valueFrom.secretKeyRef.name}`,
                  source: `Deployment-${manifest.metadata.namespace}-${manifest.metadata.name}`,
                  target: `Secret-${manifest.metadata.namespace}-${env.valueFrom.secretKeyRef.name}`,
                  animated: false,
                  type: "smoothstep",
                  data: { label: `Secret ${env.valueFrom.secretKeyRef.name}` },
                });
              } else if (env.valueFrom.configMapRef) {
                elements.push({
                  id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-${container.name}-env-${env.valueFrom.configMapRef.name}`,
                  source: `Deployment-${manifest.metadata.namespace}-${manifest.metadata.name}`,
                  target: `ConfigMap-${manifest.metadata.namespace}-${env.valueFrom.configMapRef.name}`,
                  animated: false,
                  type: "smoothstep",
                  data: {
                    label: `ConfigMap ${env.valueFrom.configMapRef.name}`,
                  },
                });
              }
            }
          });
        }
        if (container.envFrom) {
          container.envFrom.forEach((envFrom: any) => {
            if (envFrom.secretRef) {
              elements.push({
                id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-${container.name}-secret-${envFrom.secretRef.name}`,
                source: `Deployment-${manifest.metadata.namespace}-${manifest.metadata.name}`,
                target: `Secret-${manifest.metadata.namespace}-${envFrom.secretRef.name}`,
                animated: false,
                type: "smoothstep",
                data: { label: `Secret ${envFrom.secretRef.name}` },
              });
            }
            if (envFrom.configMapRef) {
              elements.push({
                id: `edge-${manifest.kind}-${manifest.metadata.namespace}-${manifest.metadata.name}-${container.name}-configmap-${envFrom.configMapRef.name}`,
                source: `Deployment-${manifest.metadata.namespace}-${manifest.metadata.name}`,
                target: `ConfigMap-${manifest.metadata.namespace}-${envFrom.configMapRef.name}`,
                animated: false,
                type: "smoothstep",
                data: { label: `ConfigMap ${envFrom.configMapRef.name}` },
              });
            }
          });
        }
      });
    });

  elements.forEach((element: any) => {
    if (element.target) {
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

  return elements;
};
