
# CloudGate: GitOps-Driven Infra Self-Service Platform

> **CloudGate** is a modern, GitOps-powered self-service platform for cloud infrastructure provisioning and management across AWS and GCP. It leverages Infrastructure as Code (IaC), GitHub Actions, and declarative workflows to deliver secure, auditable, and automated cloud operations—empowering teams to move fast without sacrificing control.

---

## 🏗️ Architecture Overview

**CloudGate** is built on the following technical pillars:

- **GitOps**: All infrastructure changes are managed via Git. Every request, approval, and deployment is tracked as code, ensuring full auditability and version control.
- **Infrastructure as Code (IaC)**: Uses Terraform for declarative, repeatable, and modular cloud resource provisioning (AWS & GCP).
- **GitHub Actions**: Orchestrates CI/CD, self-service automation, policy enforcement, and post-provisioning tasks.
- **Self-Service Portal**: A modern frontend (HTML/CSS/JS) for non-technical users to request, track, and manage cloud resources, tightly integrated with GitHub for authentication and workflow triggers.
- **Automation & Policy**: Linting, security scanning, and post-provisioning (Ansible) ensure best practices and compliance.

---

## 📂 Repository Structure & Key Components

```
terraform/
│
├── portal/                # Frontend self-service portal (HTML, CSS, JS)
│   ├── app.js             # SPA logic: OAuth, ticketing, modals, activity feed
│   ├── config.js          # Frontend config (API endpoints, OAuth)
│   ├── index.html         # UI: request forms, ticket controls, activity feed
│   └── style.css          # Responsive, accessible design
│
├── Projects/              # GCP Terraform modules
│   ├── main.tf, gcs.tf    # GCP provider, GCS buckets, modular resources
│   ├── buckets/           # Extensible bucket modules
│   ├── variables.tf, outputs.tf, backend.tf, terraform.tfvars
│
├── Projects-AWS/          # AWS Terraform modules
│   ├── main.tf, s3.tf     # AWS provider, S3 buckets, modular resources
│   ├── variables.tf, outputs.tf, backend.tf, terraform.tfvars
│
├── ansible/               # Post-provisioning automation (customize as needed)
│   ├── playbook.yml, inventory.ini
│
├── .github/               # GitHub Actions & GitOps automation
│   ├── workflows/         # All automation pipelines
│   │   ├── bucket-selfservice.yml   # Self-service: issue-driven bucket provisioning
│   │   ├── deploy-portal.yml        # CI/CD: static portal deployment
│   │   ├── terraform-plan_*.yml     # Plan, apply, destroy for AWS & GCP
│   │   ├── terraform_tflint_*.yml   # Linting (TFLint)
│   │   ├── terraform_checkov_*.yml  # Security (Checkov)
│   │   └── ... (other workflows)
│   └── ISSUE_TEMPLATE/
│       └── request-bucket.yml       # Issue form for self-service bucket requests
│
├── buildspec.yml           # AWS CodeBuild CI/CD pipeline
├── .tflint.hcl             # Linting rules for Terraform (AWS & GCP)
└── README.md               # Project documentation (this file)
```

---

## 🔄 GitOps & Automation Workflows

### 1. **Self-Service via GitHub Issues**
- Users request cloud resources (e.g., S3/GCS buckets) by submitting a GitHub Issue using a structured template.
- The `bucket-selfservice.yml` workflow listens for new issues, parses the request, and triggers the appropriate Terraform pipeline.
- All changes are made via Pull Requests or direct commits, ensuring traceability and approval workflows.

### 2. **CI/CD & IaC Automation**
- **Terraform Plan/Apply/Destroy**: Dedicated workflows for AWS and GCP run `terraform plan`, `apply`, and `destroy` in response to PRs, merges, or manual triggers.
- **Linting & Security**: TFLint and Checkov workflows enforce best practices and compliance before any infrastructure change is applied.
- **Portal Deployment**: The portal is deployed as a static site (e.g., GitHub Pages) via `deploy-portal.yml`.
- **AWS CodeBuild**: `buildspec.yml` enables native AWS CI/CD integration for hybrid or multi-cloud teams.

### 3. **Post-Provisioning Automation**
- Ansible playbooks (reserved for future use) can be triggered post-Terraform to configure resources, install agents, or perform compliance checks.

---

## 🌐 Self-Service Portal (Technical Details)
- **Frontend:** Static SPA (HTML/CSS/JS) with GitHub OAuth for authentication.
- **Features:**
	- Ticket-driven request/approval model (Recent Requests, Open Ticket, Refresh)
	- Modal popups for ticket details, scrollable activity feed, and real-time status
	- Responsive, accessible design for all user types
- **Integration:**
	- All actions (requests, status updates) are reflected in GitHub Issues and PRs
	- No backend server required—relies on GitHub APIs and Actions for orchestration

---

## ☁️ Infrastructure as Code (IaC)
- **Terraform Modules:**
	- Modular, DRY code for AWS (S3) and GCP (GCS) buckets
	- Parameterized via `variables.tf` and `terraform.tfvars` for environment-specific deployments
	- Outputs are consumed by automation workflows for status reporting and downstream tasks
- **Best Practices:**
	- `.tflint.hcl` enforces naming, region, and label conventions
	- Remote state management via `backend.tf` for team safety

---

## 🤖 GitHub Actions: Deep Dive
- **bucket-selfservice.yml**: Parses issue forms, extracts parameters, and triggers Terraform runs. All changes are PR-based for auditability.
- **terraform-plan_*.yml / terraform-apply_*.yml**: Run on PRs, merges, or manual triggers. Artifacts and logs are uploaded for traceability.
- **terraform_tflint_*.yml / terraform_checkov_*.yml**: Run on every PR/commit to catch issues early.
- **deploy-portal.yml**: Builds and deploys the portal to GitHub Pages or other static hosting.
- **Extensible**: Add new workflows for additional resource types, policy checks, or notifications.

---

## 📝 Usage & Contribution

### Getting Started
1. **Open the Portal:** Launch `portal/index.html` in your browser. Authenticate with GitHub.
2. **Request Resources:** Use the portal or submit a GitHub Issue using the provided template.
3. **Track Progress:** All requests, status, and logs are visible in the portal and GitHub Issues/PRs.
4. **Automated Delivery:** GitHub Actions handle provisioning, validation, and reporting—no manual intervention required.

### Extending CloudGate
- Add new Terraform modules/resources in `Projects/` or `Projects-AWS/`.
- Create new GitHub Actions workflows for additional automation or policy enforcement.
- Customize Ansible playbooks for post-provisioning tasks.

### Contributing
Pull requests, issues, and suggestions are welcome! Please follow the GitOps workflow: all changes via PR, with clear commit messages and linked issues.

---

**CloudGate** — The best of GitOps, IaC, and automation for secure, scalable, and self-service cloud infrastructure.