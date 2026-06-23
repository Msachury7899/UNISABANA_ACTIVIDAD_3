pipeline {
  agent any

  parameters {
    string(name: 'BRANCH', defaultValue: 'main', description: 'Rama que dispara el pipeline')
  }

  environment {
    IMAGE_NAME = "microservicio-node"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    MINIKUBE_NODE = "minikube"
  }

  triggers {
    githubPush()
    // Respaldo: revisa el repo cada 15 minutos por si el webhook no llega
    pollSCM('H/15 * * * *')
  }

  stages {
    stage('Checkout') {
      steps {
        git branch: "${params.BRANCH}", url: 'https://github.com/Msachury7899/UNISABANA_ACTIVIDAD_3.git'
      }
    }

    stage('Install & Test') {
      steps {
        dir('app') {
          sh 'npm install'
          sh 'npm test'
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        dir('app') {
          sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
        }
      }
    }

    // Sin registro externo: la imagen se construye con el Docker del host
    // (montado via /var/run/docker.sock) y se vuelca directo al Docker interno
    // del nodo de minikube, donde el kubelet ya la encuentra sin necesidad de pull.
    stage('Load Image into Minikube') {
      steps {
        sh "docker save ${IMAGE_NAME}:${IMAGE_TAG} | docker exec -i ${MINIKUBE_NODE} docker load"
      }
    }

    // Este commit es lo que ArgoCD detecta para re-sincronizar el Deployment:
    // Jenkins no llama a kubectl/helm directamente, solo actualiza el repo (GitOps).
    stage('Update Helm values (GitOps)') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
          sh """
            sed -i 's/tag: .*/tag: "${IMAGE_TAG}"/' helm/microservicio-node/values-dev.yaml
            git config user.email "jenkins@local"
            git config user.name "Jenkins"
            git add helm/microservicio-node/values-dev.yaml
            git commit -m "ci: actualizar imagen a ${IMAGE_TAG} [skip ci]"
            git push https://${GIT_USER}:${GIT_TOKEN}@github.com/Msachury7899/UNISABANA_ACTIVIDAD_3.git HEAD:${params.BRANCH}
          """
        }
      }
    }
  }
}
