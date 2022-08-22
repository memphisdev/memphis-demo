def gitBranch = env.BRANCH_NAME
def imageName = "memphis-demo"
def gitURL = "git@github.com:Memphisdev/memphis-demo.git"
def repoUrlPrefix = "memphisos"

node {
  git credentialsId: 'main-github', url: gitURL, branch: 'master'
	
  try{
	  
    stage('Login to Docker Hub') {
      withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_HUB_CREDS_USR', passwordVariable: 'DOCKER_HUB_CREDS_PSW')]) {
	sh 'docker login -u $DOCKER_HUB_CREDS_USR -p $DOCKER_HUB_CREDS_PSW'
      }
    }
		
    stage('Create memphis namespace in Kubernetes'){
      sh "aws eks --region eu-central-1 update-kubeconfig --name sandbox-cluster"
      sh "kubectl delete namespace memphis-demo"
      sh "kubectl create namespace memphis-demo --dry-run=client -o yaml | kubectl apply -f -"
      sh "aws s3 cp s3://memphis-jenkins-backup-bucket/regcred.yaml ."
      sh "kubectl apply -f regcred.yaml -n memphis-demo"
      sh "kubectl patch serviceaccount default -p '{\"imagePullSecrets\": [{\"name\": \"regcred\"}]}' -n memphis-demo"
      //sh "sleep 40"
    } 
	  
    stage('Build and push docker image to Docker Hub') {
      sh "docker buildx build --push --tag ${repoUrlPrefix}/${imageName} --platform linux/amd64,linux/arm64 ."
    }
  
    stage('Push to sandbox'){
      sh "aws eks --region eu-central-1 update-kubeconfig --name sandbox-cluster"
      sh "helm upgrade --atomic --install memphis-demo helm --create-namespace --namespace memphis-demo"
    }

	  
	
    notifySuccessful()
	  
  } catch (e) {
      currentBuild.result = "FAILED"
      cleanWs()
      notifyFailed()
      throw e
  }
}

def notifySuccessful() {
  emailext (
      subject: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
      body: """<p>SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
        <p>Check console output at &QUOT;<a href='${env.BUILD_URL}'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>&QUOT;</p>""",
      recipientProviders: [[$class: 'DevelopersRecipientProvider']]
    )
}

def notifyFailed() {
  emailext (
      subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
      body: """<p>FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
        <p>Check console output at &QUOT;<a href='${env.BUILD_URL}'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>&QUOT;</p>""",
      recipientProviders: [[$class: 'DevelopersRecipientProvider']]
    )
}
