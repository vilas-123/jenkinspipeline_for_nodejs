pipeline {
    agent any

    environment {
        DOCKERHUB_USER  = 'vilas12'
        IMAGE_NAME      = "${DOCKERHUB_USER}/nodejs-mongo-app"
        IMAGE_TAG       = "v${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Checking out code...'
                checkout scm
            }
        }

        stage('Install & Test') {
            agent {
                docker {
                    image 'node:18'
                }
            }
            steps {
                echo '📦 Installing npm packages...'
                sh 'npm install'

                echo '🧪 Running Jest tests...'
                sh 'npm test'
            }
        }

        stage('Docker Build & Push') {
            steps {
                echo '🐳 Building Docker image...'

                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest
                        docker logout
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed! Image pushed to Docker Hub.'
        }
        failure {
            echo '❌ Pipeline failed! Check logs above.'
        }
        cleanup {
            sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true"
        }
    }
}
