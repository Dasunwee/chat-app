# Technical Design Document (TDD)
**Project**: Real-Time Chat Application  
**Version**: 1.0  
**Last Updated**: $(date +%Y-%m-%d)  

---

## 1. System Architecture
### High-Level Overview
```mermaid
flowchart TD
    A[Client] --> B[Load Balancer]
    B --> C[API Server]
    C --> D[(MongoDB)]
    C --> E[Redis]
    C --> F[Socket.IO]
    F --> G[Web Clients]

    Component Diagram

    pie
    title Resource Allocation
    "API Servers" : 45
    "Database" : 30
    "Real-Time Service" : 25

    2. Detailed Design

    2.1 API Specifications
Endpoint: POST /api/messages

typescript
interface MessageRequest {
  text: string; // Max 500 chars
  userId: string; // UUIDv4
}

interface MessageResponse {
  id: string;
  timestamp: string; // ISO-8601
}

2.2 WebSocket Protocol

Event	Direction	Payload
message	Client→Server	{text: string}
typing	Server→Client	{userId: string, status: boolean}

3. Data Model
MongoDB Collections
users

javascript
{
  _id: ObjectId,
  username: string, // indexed
  lastActive: ISODate,
  status: "online" | "offline"
}
messages

javascript
{
  _id: ObjectId,
  text: string,
  senderId: ObjectId, // ref: users
  roomId: ObjectId,
  createdAt: Date, // TTL: 90 days
  updatedAt: Date
}

4. Infrastructure
Deployment Topology
Diagram
Code
graph LR
    A[CDN] --> B[API Tier]
    B --> C[Database Tier]
    C --> D[Replica Set]
    B --> E[Cache Cluster]
CI/CD Pipeline
Diagram
Code
sequenceDiagram
    Developer->>GitHub: Push code
    GitHub->>Railway: Trigger deploy
    Railway->>MongoDB: Provision DB
    Railway->>Docker: Build image


5. Cross-Cutting Concerns

Security
JWT authentication

Rate limiting: 100 requests/min per IP

Encryption: TLS 1.3 everywhere

Performance
Operation	SLA
Message send	<200ms p95
History load	<1s for 100 messages


6. Dependencies
Service	Version	Purpose
Node.js	18.x	Runtime
Socket.IO	4.7.x	Real-time
MongoDB	6.0+	Database


7. Open Issues
Sharding strategy for message history

Disaster recovery plan

Revision History

Version	Date	Changes
1.0	$(date +%Y-%m-%d)	Initial version


### Key Features:
1. **Live Diagrams**: Mermaid flowcharts that render automatically in GitHub/GitLab
2. **Code-Ready Specs**: TypeScript interfaces for API contracts
3. **Database Schemas**: Ready-to-implement MongoDB models
4. **SLA Tracking**: Clear performance benchmarks

### How to Use:
1. Replace `$(date +%Y-%m-%d)` with actual date
2. Update MongoDB schemas with your field names
3. Add your real deployment topology

### Pro Tip:
For team collaboration:
```markdown
## Decision Records
| ID | Decision | Rationale |
|----|----------|-----------|
| 001 | Use Socket.IO | Fallback to HTTP support |
| 002 | MongoDB Atlas | Fully managed DB service |



