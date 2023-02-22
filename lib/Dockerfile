FROM quay.io/xelectra/xasena:latest
RUN git clone https://github.com/SUHAID-BRO/AFIYA-MD /root/X-Asena
WORKDIR /root/X-Asena
RUN yarn install --network-concurrency 1
CMD ["node", "bot.js"] 

