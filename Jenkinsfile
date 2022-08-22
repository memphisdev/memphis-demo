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
      sh "kubectl delete namespace memphis-demo --ignore-not-found=true"
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

    stage('Configure sandbox demo URLs'){
    //broker url section      
      sh "aws s3 cp s3://memphis-jenkins-backup-bucket/sandbox_files/update_demo_sandbox_record.json ."  //demo.sandbox.memphis.dev redirect to new LB record
      sh(script: """sed "s/\\"DNSName\\": \\"\\"/\\"DNSName\\": \\"\$(aws elbv2 describe-load-balancers --load-balancer-arns | grep "k8s-memphisd-memphisd" | grep DNS | awk '{print \"dualstack.\"\$2}' | sed 's/"//g' | sed 's/,//g')\\"/g"   update_demo_sandbox_record.json > record2.json""",  returnStdout: true)
      sh(script: """aws route53 change-resource-record-sets --hosted-zone-id Z05132833CK9UXS6W3I0E --change-batch file://record2.json > status2.txt""",    returnStdout: true) 
      sh "rm -rf record2.json update_demo_sandbox_record.json"
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
