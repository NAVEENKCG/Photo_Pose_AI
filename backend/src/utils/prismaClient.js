// src/utils/prismaClient.js - Prisma singleton
const { PrismaClient } = require('@prisma/client');

let prismaInstance = null;

const getPrisma = () => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return prismaInstance;
};

module.exports = { getPrisma };
