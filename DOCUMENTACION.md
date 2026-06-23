# Documentación del proyecto (resumen)

## Qué se construyó

Un microservicio Node.js/Express, dockerizado, desplegado en Kubernetes (minikube) mediante un chart de Helm, gestionado con GitOps a través de ArgoCD, y con un pipeline de Jenkins que automatiza build, pruebas y despliegue ante cada commit en `main`.

## 1. Microservicio y Docker

- API Express con endpoints `/`, `/health`, `/version` y un CRUD en memoria en `/api/items` (`app/src`).
- `app/Dockerfile`: build multi-stage (`deps` + `runtime`), corre como usuario no-root, con `HEALTHCHECK` apuntando a `/health`.
- Pruebas con el test runner nativo de Node (`node --test`), validando que `/health` responde `200 { status: "UP" }`.

## 2. Helm

- Chart en `helm/microservicio-node/` con `Deployment`, `Service`, `Ingress` (opcional) y `HPA` (opcional).
- `values.yaml` define los defaults (imagen, recursos, probes). `values-dev.yaml` sobrescribe solo lo que cambia para el entorno dev (tag de imagen, recursos).
- La imagen no se descarga de ningún registro externo: `pullPolicy: Never`, porque se carga directo en el Docker interno del nodo de minikube (ver punto 5).

## 3. Kubernetes (minikube)

- Clúster local con `minikube start --driver=docker`.
- El microservicio corre en el namespace `microservicio-dev`, gestionado por ArgoCD (no por `helm install` manual).

## 4. ArgoCD (GitOps)

- Instalado en el namespace `argocd` dentro del mismo clúster.
- `argocd/application-dev.yaml` define la `Application` que apunta al repo de GitHub y al chart (`helm/microservicio-node`), con `syncPolicy.automated` (`prune` + `selfHeal`): cualquier commit nuevo en `main` se aplica solo, sin `kubectl apply` ni `helm upgrade` manual.
- Intervalo de reconciliación bajado a 15s (`timeout.reconciliation` en el configmap `argocd-cm`) para que los cambios se reflejen casi de inmediato.

## 5. Jenkins (CI/CD)

Pipeline definido en `Jenkinsfile`, con 5 stages:

1. **Checkout**: clona la rama configurada del repo.
2. **Install & Test**: `npm install` + `npm test`.
3. **Build Docker Image**: construye la imagen con el Docker del host (vía `/var/run/docker.sock` montado en el contenedor de Jenkins).
4. **Load Image into Minikube**: `docker save <imagen> | docker exec -i minikube docker load` — sube la imagen directo al Docker interno del nodo de minikube, sin pasar por ningún registro (Docker Hub u otro).
5. **Update Helm values (GitOps)**: actualiza el tag de imagen en `values-dev.yaml` y hace `git commit` + `git push` a `main`. Este commit es lo que ArgoCD detecta para resincronizar el Deployment.

**Disparo automático**: el pipeline tiene `githubPush()` (webhook) y `pollSCM('* * * * *')` como respaldo (revisa el repo cada minuto), así que se dispara solo al detectar un commit, sin intervención manual — aunque también se puede lanzar a mano con "Build Now".

## Flujo completo (resumen visual)

```
commit en GitHub (main)
   -> Jenkins detecta el cambio (poll/webhook)
   -> npm install + test
   -> docker build
   -> docker save | docker exec minikube docker load
   -> actualiza values-dev.yaml + git push
   -> ArgoCD detecta el commit y sincroniza
   -> Kubernetes (minikube) corre la nueva imagen
```

## Decisiones de diseño relevantes

- **Sin Docker Hub**: para evitar depender de una cuenta/registro externo, la imagen se construye localmente y se carga directo en el nodo de minikube. Esto solo funciona porque Jenkins corre en el mismo Docker Desktop que minikube (ambos comparten el mismo host).
- **GitOps real**: Jenkins nunca despliega directamente al clúster (no llama `kubectl`/`helm`); solo modifica el repo Git. ArgoCD es el único que aplica cambios en Kubernetes, manteniendo el repo como única fuente de verdad.
- **Un solo entorno (dev)**: se simplificó el chart para manejar solo `values.yaml` + `values-dev.yaml`, suficiente para demostrar el patrón de overrides por entorno.
