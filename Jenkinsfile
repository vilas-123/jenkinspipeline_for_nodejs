pipeline {
    agent any

    environment {
        DOCKERHUB_USER = 'vilas12'
        IMAGE_NAME = "${DOCKERHUB_USER}/nodejs-mongo-app"
        IMAGE_TAG = "v${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Checking out code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('nodejs') {
                    sh 'npm install'
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('nodejs') {
                echo '🧪 Running Jest tests...'
                sh 'npm test || true'
            }
        }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    dir('nodejs') {
                        sh """
                            npx sonar-scanner \
                                -Dsonar.projectKey=nodejs-mongo-app \
                                -Dsonar.sources=src \
                                -Dsonar.tests=tests \
                                -Dsonar.host.url=http://sonarqube:9000 \
                                -Dsonar.login=${SONAR_AUTH_TOKEN}
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir('nodejs') {
                echo '🐳 Building Docker image...'
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
            }
        }
        }

        stage('Push to Docker Hub') {
            steps {
                echo '🚀 Pushing to Docker Hub...'

                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest
                        docker logout
                    '''
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
peline {
    agent any

    environment {
        DOCKERHUB_USER = 'vilas12'
        IMAGE_NAME = "${DOCKERHUB_USER}/nodejs-mongo-app"
        IMAGE_TAG = "v${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Checking out code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('nodejs') {
                    sh 'npm install'
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('nodejs') {
                echo '🧪 Running Jest tests...'
                sh 'npm test || true'
            }
        }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    dir('nodejs') {
                        sh """
                            npx sonar-scanner \
                                -Dsonar.projectKey=nodejs-mongo-app \
                                -Dsonar.sources=src \
                                -Dsonar.tests=tests \
                                -Dsonar.host.url=http://sonarqube:9000 \
                                -Dsonar.login=${SONAR_AUTH_TOKEN}
                        """
                    }
                }
