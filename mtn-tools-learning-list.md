# MTN Job-Relevant Skills Matrix

This is a focused preparation list for a software engineering role involving digital platforms, backend services, mobile applications, production operations, and telecom-scale reliability.

Legend:

- [x] Already covered
- [ ] Useful gap to learn
- **Alternative:** an existing skill that covers the same general capability

## 1. Software Development

- [x] Kotlin and Java
- [x] Bash scripting
- [x] Spring Boot and Ktor
- [x] REST API development
- [x] SQL and relational databases
- [x] Git and GitHub

These are core software engineering skills and should remain prominent on the CV.

## 2. API Design and Testing

- [x] Swagger / OpenAPI
- [x] Postman
- [x] JWT and OAuth2
- [x] API load testing with k6

**Alternatives:**

- Swagger / OpenAPI covers API contracts and documentation.
- Postman covers manual API testing and basic automated collections.
- k6 adds performance and load testing, which is not fully covered by Postman.

## 3. Messaging and Real-Time Systems

- [x] MQTT
- [x] RabbitMQ
- [x] Redis
- [x] WebRTC and LiveKit
- [ ] Apache Kafka only if the job description explicitly mentions high-volume event streaming

**Alternatives:**

- MQTT is well suited to lightweight real-time messaging and constrained networks.
- RabbitMQ covers reliable queue-based business messaging.
- Redis covers caching and lightweight pub/sub.
- Kafka is not automatically required when MQTT and RabbitMQ already meet the system's needs.

## 4. Linux, Networking, and Troubleshooting

- [x] Linux operations
- [x] TCP/IP, DNS, HTTP/HTTPS, TLS, routing, ports, latency, and bandwidth
- [x] Advanced subnetting
- [x] Wireshark
- [x] Load balancers and reverse proxies
- [x] Basic telecom-network fundamentals: 3G, 4G, 5G, latency, availability, and service continuity
- [ ] Basic firewall administration

Telecom knowledge is currently foundational rather than specialist-level and should be described as basic knowledge in interviews.

## 5. Monitoring and Observability

- [x] Zabbix
- [x] Prometheus
- [ ] Grafana
- [ ] Centralised logging with ELK / Elastic Stack

**Alternatives and complements:**

- Zabbix already covers infrastructure and service monitoring.
- Prometheus is an alternative monitoring and metrics platform, especially common with Kubernetes.
- Grafana complements Zabbix or Prometheus by providing dashboards and visualisation.
- ELK focuses on centralised logs, so it complements monitoring rather than replacing Zabbix.

Recommended priority: connect existing Prometheus knowledge to Grafana dashboards.

## 6. Containers and Deployment

- [x] Docker
- [x] Kubernetes
- [x] Kubernetes production troubleshooting: probes, resources, ingress, ConfigMaps, and secrets
- [x] Helm
- [x] Cloud Run

**Alternatives and complements:**

- Cloud Run is an alternative to managing Kubernetes for simpler container deployments.
- Kubernetes is more flexible for complex services.
- Helm complements Kubernetes; it is not a replacement.

## 7. CI/CD and Source Control

- [x] GitHub
- [x] GitHub Actions
- [ ] Jenkins only if MTN's environment specifically uses it
- [ ] GitLab CI only if MTN's environment specifically uses it

**Alternatives:**

- GitHub Actions, Jenkins, and GitLab CI solve the same broad CI/CD problem.
- Your GitHub Actions knowledge demonstrates the transferable concepts: pipelines, stages, build, test, secrets, artifacts, and deployment.
- Learn Jenkins terminology and interface before an interview if it appears in the offer; do not prioritise a full Jenkins project otherwise.

## 8. Security

- [x] Secure API flows
- [x] JWT and OAuth2
- [x] Authentication and authorisation
- [x] OWASP fundamentals
- [x] Mobile security fundamentals: secure data storage, authentication and authorisation, secure communication, input validation, secrets, and dependency risks
- [ ] Keycloak only if centralised identity management appears in the job description

**Alternatives and complements:**

- JWT and OAuth2 are protocols and token mechanisms.
- Keycloak is a platform that implements identity and access management using standards such as OAuth2 and OpenID Connect.
- OWASP knowledge covers common application and mobile risks; advanced penetration testing remains a separate specialisation.

## 9. Professional Delivery

- [x] Team collaboration
- [x] Autonomous ownership
- [x] Fast learning and adaptability
- [x] Requirements clarification
- [x] Stakeholder communication
- [x] Priority and deadline management
- [x] Production troubleshooting
- [x] Technical documentation

These are relevant because the CV supports them with professional experience, not only claims.

## Focused Learning Priority

1. [ ] Deepen telecom fundamentals beyond the current basic level
2. [ ] Grafana dashboards using Zabbix or Prometheus data
3. [ ] PromQL query depth and alert design
4. [ ] Basic firewall administration
5. [ ] Advanced mobile application security testing
6. [ ] ELK basics for centralised logging

## Low-Priority Unless Named in the Offer

- [ ] Jenkins, because GitHub Actions already covers CI/CD concepts
- [ ] GitLab CI, for the same reason
- [ ] Kafka, because MQTT and RabbitMQ already cover relevant messaging patterns
- [ ] Keycloak, because JWT and OAuth2 fundamentals are already owned
- [ ] Terraform and Ansible, unless infrastructure automation is part of the position

## Interview Positioning

When an interviewer asks about an unfamiliar equivalent tool, use this structure:

> I have not used that exact product extensively, but I use [existing alternative] for the same engineering capability. I understand the underlying concepts and can transfer them quickly.

Examples:

- Jenkins: existing alternative is GitHub Actions.
- Prometheus: existing alternative is Zabbix; Prometheus uses a metrics-first model common in cloud-native systems.
- Kafka: existing alternatives are MQTT and RabbitMQ, depending on the messaging requirement.
- Keycloak: existing foundation is JWT and OAuth2.
- GitLab CI: existing alternative is GitHub Actions.
