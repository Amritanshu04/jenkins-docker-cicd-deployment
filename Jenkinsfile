pipeline {
    agent any

    environment {
        IMAGE_NAME = 'jenkins-docker-cicd-deployment:latest'
        APP_CONTAINER = 'jenkins-cicd-app'
        TEST_CONTAINER = 'jenkins-cicd-test'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Node.js') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE:/app" \
                      -w /app \
                      node:22-alpine \
                      node --version
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE:/app" \
                      -w /app \
                      node:22-alpine \
                      npm ci
                '''
            }
        }

        stage('Test Application') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE:/app" \
                      -w /app \
                      node:22-alpine \
                      npm test
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t "$IMAGE_NAME" .'
            }
        }

        stage('Test HTTP Application') {
            steps {
                sh '''
                    set -eu

                    docker rm -f "$TEST_CONTAINER" 2>/dev/null || true

                    cleanup() {
                        docker rm -f "$TEST_CONTAINER" 2>/dev/null || true
                    }
                    trap cleanup EXIT

                    docker run -d \
                      --name "$TEST_CONTAINER" \
                      -p 127.0.0.1:3001:3000 \
                      "$IMAGE_NAME"

                    for i in $(seq 1 15); do
                        if docker exec "$TEST_CONTAINER" node -e "
                            require('http').get('http://127.0.0.1:3000/', res => {
                                let body = '';
                                res.setEncoding('utf8');
                                res.on('data', chunk => body += chunk);
                                res.on('end', () => {
                                    console.log('HTTP Status:', res.statusCode);
                                    if (res.statusCode === 200 &&
                                        body.includes('Hello from Jenkins CI/CD!')) {
                                        console.log('HTTP application test passed');
                                        process.exit(0);
                                    }
                                    console.error('Unexpected response');
                                    process.exit(1);
                                });
                            }).on('error', () => process.exit(1));
                        "; then
                            exit 0
                        fi
                        sleep 2
                    done

                    echo 'HTTP application test failed'
                    docker logs "$TEST_CONTAINER"
                    exit 1
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sh '''
                    set -eu

                    docker rm -f "$APP_CONTAINER" 2>/dev/null || true

                    docker run -d \
                      --restart unless-stopped \
                      --name "$APP_CONTAINER" \
                      -p 3000:3000 \
                      "$IMAGE_NAME"

                    sleep 3

                    docker exec "$APP_CONTAINER" node -e "
                        require('http').get('http://127.0.0.1:3000/', res => {
                            console.log('Deployment HTTP Status:', res.statusCode);
                            process.exit(res.statusCode === 200 ? 0 : 1);
                        }).on('error', err => {
                            console.error(err);
                            process.exit(1);
                        });
                    "

                    echo 'Deployment successful'
                '''
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check Console Output.'
        }

        always {
            sh 'docker image ls jenkins-docker-cicd-deployment || true'
        }
    }
}
