@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.12"
set "MAVEN_HOME=C:\Users\Mithilesh\AppData\Local\Programs\Apache\maven\apache-maven-3.9.16"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"

cd /d "%~dp0"
echo Starting Spring Boot Backend (Java 21, Port 8080)...
call "%MAVEN_HOME%\bin\mvn.cmd" spring-boot:run
pause
