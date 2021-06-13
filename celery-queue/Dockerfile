FROM python:2

ENV CELERY_BROKER_URL redis://redis:6379/0
ENV CELERY_RESULT_BACKEND redis://redis:6379/0
ENV C_FORCE_ROOT true

COPY . /queue
WORKDIR /queue

RUN apt-get update && apt-get upgrade -y && apt-get install -y \
  graphviz \
  xdg-utils \
  openjdk-11-jdk

RUN pip install -r requirements.txt

EXPOSE 5555

ENTRYPOINT [ "/queue/entrypoint.sh" ]