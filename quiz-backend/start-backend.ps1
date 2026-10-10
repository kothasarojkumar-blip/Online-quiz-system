$jdkPath = "C:\Program Files\Java\jdk-21.0.12"
$mavenHome = "C:\Users\Mithilesh\AppData\Local\Programs\Apache\maven\apache-maven-3.9.16"
$env:JAVA_HOME = $jdkPath
$env:MAVEN_HOME = $mavenHome
$env:Path = "$jdkPath\bin;$mavenHome\bin;$env:Path"

Set-Location $PSScriptRoot
Write-Host "Starting Spring Boot Backend (Java 21, Port 8080)..."
& "$mavenHome\bin\mvn.cmd" spring-boot:run
