FROM node
WORKDIR /app
COPY . /app
ENV SUB="https://api.tesseractonline.com/studentmaster/subjects/2/1"
ENV UNIT="https://api.tesseractonline.com/studentmaster/get-subject-units/"
ENV TOPIC="https://api.tesseractonline.com/studentmaster/get-topics-unit/"
EXPOSE 3000
CMD ["node", "index.js"]