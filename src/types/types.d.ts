export type AnyObject = {
  [U: string]: any;
};

export interface ManifestList {
  kind: string;
  apiVersion: string;
  items: Manifest[];
  metadata?: AnyObject;
}

export interface Manifest {
  kind: string;
  apiVersion: string;
  metadata?: AnyObject;
  [U: string]: any;
}
