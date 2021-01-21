# react-k8s-viewer

Render diagrams from your kubernetes manifests

See demo : https://socialgouv.github.io/react-k8s-viewer

![](./demo.png)

## Usage

`K8sViewer` expect a list of kube manifests as SJON

```js
import { K8sViewer } from "react-k8s-viewer";

import manifests from "./manifests.json";

const App = () => <K8sViewer manifests={manifests} />;
```

To extract the manifests from some namespace:

```sh
kubectl --namespace some-app  get deploy,ing,service,secret,sealedsecret,configmap -ojson > manifests.json
```
