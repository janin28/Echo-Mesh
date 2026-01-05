# API Reference

## Backend Endpoints

### Configuration
- `GET /api/config`: Retrieve current node configuration.
- `PUT /api/config`: Update node settings (bandwidth, regions, etc.).

### Monitoring
- `GET /api/stats`: Summary of node status, earnings, and health alerts.
- `GET /api/metrics`: Historical performance data for charts.
- `GET /api/health`: Detailed health check indicators.
- `GET /api/logs`: System and network activity logs.

### Sessions & Payouts
- `GET /api/sessions`: List active and historical bandwidth sessions.
- `POST /api/settlement/:sessionId`: Trigger the settlement process for a completed session.
- `GET /api/payouts`: View all payout records.

### Control
- `POST /api/control/:action`: Start, stop, or pause the daemon.
