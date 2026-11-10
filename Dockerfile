# ===== 后端服务：Node + Python ML =====
FROM node:22-slim
WORKDIR /app

# 安装 Python 与 ML 依赖
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# 后端依赖
COPY package*.json ./
RUN npm ci --omit=dev

# ML 依赖
COPY backend/ml/requirements.txt ./backend/ml/requirements.txt
RUN pip3 install --break-system-packages -r backend/ml/requirements.txt

# 拷贝代码
COPY . .

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "backend/server/index.cjs"]
