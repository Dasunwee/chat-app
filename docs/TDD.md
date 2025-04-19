# Technical Design Document (TDD)
**Project**: Real-Time Chat Application  
**Version**: 1.0  
**Last Updated**: 2024-06-15  
**Owner**: [Dasun Weerawardhana]  

---

## 1. System Architecture

### 1.1 High-Level Overview
```mermaid
flowchart TD
    A[Client] --> B[Load Balancer]
    B --> C[API Server]
    C --> D[(MongoDB)]
    C --> E[Redis]
    C --> F[Socket.IO]
    F --> G[Web Clients]

