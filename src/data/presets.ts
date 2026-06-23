import { PresetExample } from '../types';

export const PRESETS: PresetExample[] = [
  {
    name: "E-Commerce Orders (Union Schema)",
    description: "Orders array with mismatched properties (e.g. some items have discount codes, others have custom gift messages). Great for showcasing array schema merging.",
    json: JSON.stringify([
      {
        "id": "ORD-2026-904",
        "date": "2026-06-21",
        "customer": {
          "id": "CUST-883",
          "name": "Alex Mercer",
          "email": "alex.m@example.com",
          "type": "VIP"
        },
        "items": [
          { "productId": "PROD-102", "name": "Mechanical Keyboard", "price": 149.99, "quantity": 1, "warrantyMonths": 24 },
          { "productId": "PROD-405", "name": "USB-C Hub", "price": 45.00, "quantity": 2, "discount": 10.00 }
        ],
        "payment": {
          "method": "Credit Card",
          "amount": 229.99,
          "status": "Completed"
        },
        "shipping": {
          "carrier": "FedEx",
          "trackingNumber": "1Z999AA10123456784",
          "address": {
            "street": "100 Pine St",
            "city": "San Francisco",
            "state": "CA",
            "zip": "94111"
          }
        }
      },
      {
        "id": "ORD-2026-905",
        "date": "2026-06-22",
        "customer": {
          "id": "CUST-411",
          "name": "Sarah Connor",
          "email": "sarah.c@example.com"
        },
        "items": [
          { "productId": "PROD-701", "name": "Noise Cancelling Headphones", "price": 299.99, "quantity": 1, "giftWrapped": true, "giftMessage": "Happy Birthday!" }
        ],
        "payment": {
          "method": "PayPal",
          "amount": 299.99,
          "status": "Pending"
        },
        "shipping": {
          "carrier": "UPS",
          "address": {
            "street": "456 Oak Ave",
            "city": "Los Angeles",
            "state": "CA",
            "zip": "90001"
          }
        },
        "tags": ["Urgent", "Gift"]
      }
    ], null, 2)
  },
  {
    name: "Corporate Directory & Profiles",
    description: "Detailed hierarchy of users, departments, direct reports, and tech stacks, perfect for experimenting with selective field extractions.",
    json: JSON.stringify({
      "company": "Antigravity Labs",
      "established": 2024,
      "headquarters": "Seattle, WA",
      "departments": [
        {
          "name": "Engineering",
          "lead": {
            "name": "Marcus Aurelius",
            "email": "marcus@antigravity.org"
          },
          "teamSize": 18,
          "activeProjects": ["ZeroGravity UI", "HyperScale Compiler"],
          "members": [
            { "id": "EMP-01", "name": "Elena Rostova", "role": "Senior Engineer", "skills": ["TypeScript", "Rust", "React"], "active": true },
            { "id": "EMP-02", "name": "David Chen", "role": "Fullstack Engineer", "skills": ["NodeJS", "TypeScript", "PostgreSQL"], "active": true, "remote": true }
          ]
        },
        {
          "name": "Design & UX",
          "lead": {
            "name": "Livia Drusilla",
            "email": "livia@antigravity.org"
          },
          "teamSize": 6,
          "activeProjects": ["Sleek Design System"],
          "members": [
            { "id": "EMP-10", "name": "Aiden Fletcher", "role": "Product Designer", "skills": ["Figma", "TailwindCSS", "Motion"], "active": true }
          ]
        }
      ],
      "globalSla": "99.99%",
      "securityEnforced": true
    }, null, 2)
  },
  {
    name: "Advanced Application Config",
    description: "Complex hierarchical config file with deeply nested environment flags, databases, CORS headers, and logger details.",
    json: JSON.stringify({
      "app": {
        "env": "production",
        "debug": false,
        "features": {
          "enableSso": true,
          "allowGuestCheckout": false,
          "betaFeatures": ["ai-auto-tagging", "multicurrency-v2"]
        },
        "security": {
          "cors": {
            "origins": ["https://antigravity.org", "https://app.antigravity.org"],
            "allowHeaders": ["Authorization", "Content-Type"],
            "maxAge": 86400
          },
          "rateLimit": {
            "windowMs": 60000,
            "maxRequests": 100
          }
        }
      },
      "databases": {
        "primary": {
          "driver": "postgresql",
          "host": "pg-prod-01.internal",
          "port": 5432,
          "pool": { "min": 5, "max": 20 },
          "ssl": true
        },
        "cache": {
          "driver": "redis",
          "host": "redis-prod-01.internal",
          "port": 6379,
          "ttl": 3600
        }
      },
      "logging": {
        "level": "info",
        "format": "json",
        "transports": [
          { "type": "console", "enabled": true },
          { "type": "file", "path": "/var/log/app.log", "maxSize": "10MB", "backups": 5 }
        ]
      }
    }, null, 2)
  }
];
