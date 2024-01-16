# <a href="https://email.tonynguyen61.com" target="_blank" rel="noopener noreferrer">Use</a>

# An email service

## To run the email service locally

1. Clone the repo `git clone https://github.com/nhhoang-tony/Email.git` 

2. Ensure you have Python installed on your system. If not, follow this guide to install `https://www.python.org/downloads/`

3. Run `pip install -r requirements.txt` to install the project dependencies.

4. Run `echo $TZ > /etc/timezone` and `ln -snf /usr/share/zoneinfo/$TZ /etc/localtime` to set up timezone

5. Run `python manage.py runserver` to start the email service and start communicating with people.

# Afternatively, run the email service locally via Docker

1. Ensure you have Docker installed on your system. If not, follow this guide here to install `https://docs.docker.com/engine/install/`

2. Download the docker image `docker pull tonynguyen61/cs50w_mail:latest`

3. Run Docker image locally `docker run -it -p 8080:8080 tonynguyen61/cs50w_mail:latest`

4. If you run the email service locally via Docker, this is just a local email service for demo only. You won't be able to communicate with other people.
