pipeline {
    agent any
    tools {
        git 'Default'
    }
    stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    }
    post {
        success {
            // Actions to perform if the pipeline succeeds
            echo 'Pipeline succeeded!'
        }
        failure {
            // Actions to perform if the pipeline fails
            echo 'Pipeline failed!'
        }
    }
}
