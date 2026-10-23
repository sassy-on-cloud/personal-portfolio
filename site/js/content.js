// All portfolio content lives here. Edit this file, not the rendering code.
export const CONTACT = {
  email: 'shashwataryal2026@gmail.com',
  phone: '+977 9765340161',
  github: 'https://github.com/sassy-on-cloud',
  linkedin: 'https://www.linkedin.com/in/shashwataryal/',
};

// status: 'used' = appears in a project below; 'learning' = still building experience.
export const SKILLS = [
  { group: 'Cloud and infrastructure', items: [['AWS', 'used'], ['EC2', 'used'], ['ECS Fargate', 'used'], ['Amazon ECR', 'used'], ['VPC', 'used'], ['IAM', 'used'], ['Security groups', 'used'], ['Application Load Balancer', 'used'], ['CloudWatch', 'used']] },
  { group: 'Systems and containers', items: [['Linux', 'used'], ['Ubuntu', 'used'], ['Bash fundamentals', 'used'], ['Docker', 'used'], ['Docker Compose', 'used'], ['Nginx', 'learning']] },
  { group: 'Infrastructure as code and automation', items: [['Terraform', 'used'], ['Git', 'used'], ['GitHub', 'used'], ['GitHub Actions', 'used'], ['CI/CD pipelines', 'used'], ['GitHub Actions OIDC', 'used']] },
  { group: 'Development and testing', items: [['C#', 'used'], ['ASP.NET Core', 'used'], ['.NET', 'used'], ['SQL Server', 'used'], ['Automated testing', 'used'], ['HTTP integration testing', 'used']] },
  { group: 'Observability and orchestration', items: [['Prometheus', 'learning'], ['Grafana', 'learning'], ['Kubernetes', 'learning']] },
  { group: 'Security', items: [['IAM least privilege', 'used'], ['Network security fundamentals', 'used'], ['HTTP security headers', 'used'], ['Input validation', 'used'], ['Secure configuration', 'used']] },
];

export const FILTERS = ['All', 'Cloud', 'DevOps', 'Infrastructure as Code', 'Containers', 'Security'];

// flow nodes: [label, planned?]
export const PROJECTS = [
  {
    id: 'cloud-native-devops-platform',
    title: 'Cloud-Native DevOps Platform',
    status: 'In progress',
    categories: ['Cloud', 'DevOps', 'Containers', 'Security'],
    stack: ['ASP.NET Core MVC', '.NET 10', 'AWS ECS Fargate', 'Terraform', 'Docker', 'Amazon ECR', 'GitHub Actions OIDC', 'CloudWatch'],
    summary: 'An in-progress cloud platform with a Terraform-managed AWS network, an ASP.NET Core app, and an automated ECS Fargate deployment.',
    problem: 'Build a repeatable path from application changes to a running AWS workload, while learning how infrastructure, identity, security, and health checks fit together.',
    solution: 'Terraform provisions the network, ECR, load balancer, and ECS resources. GitHub Actions authenticates through OIDC, builds and publishes a commit-tagged image, deploys it to ECS, and checks service health.',
    flow: [['Git commit'], ['GitHub Actions'], ['OIDC + IAM'], ['Docker image'], ['Amazon ECR'], ['ECS Fargate'], ['Application Load Balancer']],
    implemented: ['ASP.NET Core MVC application and automated tests', 'Docker image build and Amazon ECR publishing', 'Terraform-managed VPC, subnets, routing, security groups, ECR, ALB, and ECS Fargate', 'GitHub Actions deployment using OIDC and a least-privilege IAM role', 'Deployment health verification behind the ALB', 'Input validation, anti-forgery protection, and tested HTTP security headers'],
    planned: ['Production database configuration for PostgreSQL-backed request storage', 'Environment-aware deployments', 'AWS WAF and further application security', 'Kubernetes / Amazon EKS exploration', 'Prometheus, Grafana, and fuller observability'],
    security: 'The workflow uses GitHub OIDC instead of long-lived AWS keys, scoped IAM permissions, separate ALB and ECS security groups, and ECR image scanning. The repository notes that the public load balancer currently uses HTTP; TLS remains planned.',
    evidence: 'The repository README records a successful CI/CD deployment, a healthy ALB target, and HTTP 200 from the public application. PostgreSQL persistence is verified locally; its production configuration is deferred. These are repository-reported results, not independent measurements.',
    lessons: 'Using OIDC avoids storing long-lived AWS keys in GitHub. Separating liveness from database-aware readiness also makes health checks useful when database-backed changes are not yet configured for deployment.',
    repo: 'https://github.com/sassy-on-cloud/cloud-native-devops-platform',
  },
  {
    id: 'producthub',
    title: 'ProductHub: Dockerized Web Application',
    status: 'Completed',
    categories: ['Cloud', 'Containers'],
    stack: ['ASP.NET Core MVC', '.NET', 'Entity Framework Core', 'SQL Server', 'Docker', 'Docker Compose', 'Amazon ECR', 'EC2'],
    summary: 'An ASP.NET Core MVC app with Entity Framework Core and SQL Server, run with Docker Compose and deployed through Amazon ECR to EC2.',
    problem: 'Move a database-backed web app from "works on my machine" to a repeatable container workflow on AWS.',
    solution: 'The app and SQL Server run as containers defined in Docker Compose. Images are pushed to Amazon ECR and pulled onto an EC2 instance.',
    flow: [['Docker build'], ['Amazon ECR'], ['EC2'], ['Docker Compose'], ['App + SQL Server']],
    implemented: ['MVC app with Entity Framework Core', 'SQL Server in a container', 'Docker Compose configuration', 'ECR to EC2 deployment workflow'],
    planned: [],
    evidence: 'Use the repository README and committed screenshots as the source of truth for the deployment details. No uptime, traffic or user numbers are claimed.',
    lessons: 'Containerising the app and database makes the runtime more repeatable, while deployment still depends on correct environment configuration, networking, and secrets handling.',
    repo: 'https://github.com/sassy-on-cloud/producthub-aws-deployment',
  },
  {
    id: 'terraform-aws-infrastructure',
    title: 'Terraform AWS Infrastructure',
    status: 'Completed',
    categories: ['Cloud', 'Infrastructure as Code'],
    stack: ['Terraform', 'AWS provider', 'VPC', 'Security groups'],
    summary: 'A Terraform lab that provisions a VPC, public subnet, routing, security group, and Ubuntu EC2 instance.',
    problem: 'Learn to describe cloud networking in code so it can be reviewed, repeated and torn down.',
    solution: 'Terraform configuration for an isolated VPC, public subnet, Internet Gateway, route table, security group, and Ubuntu EC2 instance.',
    flow: [['Terraform'], ['VPC'], ['Public subnet'], ['Internet Gateway'], ['Route table'], ['Security group'], ['EC2']],
    implemented: ['AWS provider configuration', 'VPC and public subnet', 'Internet Gateway and route association', 'Security group rules with SSH scoped to an administrator IP', 'Ubuntu EC2 instance and Terraform lifecycle documentation'],
    planned: [],
    evidence: 'The configuration is in the repository. Compute and private subnets are not part of this lab.',
    lessons: 'Terraform makes infrastructure changes reviewable, but security-group scope and routing choices must be checked before applying changes. Avoid leaving billable resources running when a lab is finished.',
    repo: 'https://github.com/sassy-on-cloud/terraform-aws-infrastructure',
  },
  {
    id: 'linux-server-administration',
    title: 'Linux Server Administration',
    status: 'Completed',
    categories: ['DevOps'],
    stack: ['Linux', 'Ubuntu', 'Bash'],
    summary: 'Documented system administration workflows and command-line fundamentals for working with servers.',
    problem: 'Build a dependable foundation in the Linux skills that cloud and DevOps work relies on.',
    solution: 'Step-by-step notes and exercises covering everyday server administration tasks.',
    flow: [],
    implemented: ['Documented administration workflows', 'Command-line practice'],
    planned: [],
    evidence: 'See the repository for the full list of covered topics.',
    lessons: 'Linux troubleshooting becomes more repeatable when commands, expected outputs, and the reason for each step are documented together.',
    repo: 'https://github.com/sassy-on-cloud/linux-server-administration',
  },
  {
    id: 'aws-cloud-quest',
    title: 'AWS Cloud Quest: Cloud Practitioner',
    status: 'Completed training',
    categories: ['Cloud'],
    stack: ['AWS'],
    summary: 'Completed AWS Cloud Quest: Cloud Practitioner training, with hands-on notes covering core AWS services and concepts.',
    problem: 'Build practical familiarity with AWS services and the shared responsibility model before applying them in larger projects.',
    solution: 'Completed Cloud Quest exercises across compute, networking, databases, storage, security, scaling, and high availability, with selected evidence documented in the repository.',
    flow: [],
    implemented: ['Completed AWS Skill Builder Cloud Quest: Cloud Practitioner training', 'Documented selected hands-on work across core AWS services and concepts'],
    planned: [],
    evidence: 'The repository links to the AWS Skill Builder training badge on Credly. This is a training badge, not an AWS certification.',
    lessons: 'Cloud fundamentals are easier to retain when each service is connected to a practical scenario and the shared-responsibility model.',
    repo: 'https://github.com/sassy-on-cloud/aws-cloud-quest-cloud-practitioner',
  },
];

export const JOURNEY = [
  ['Linux administration and Git fundamentals', 'Command line, servers and version control.'],
  ['Docker and containerised applications', 'Packaging ASP.NET Core apps with Docker and Compose.'],
  ['AWS deployment and registry workflows', 'Amazon ECR and EC2 for running containers.'],
  ['Terraform and infrastructure as code', 'Networking described in code.'],
  ['CI/CD, application security and automated testing', 'GitHub Actions, security headers and integration tests.'],
  ['Kubernetes and observability', 'Prometheus, Grafana and Kubernetes.', true],
];

// Learning areas and planned project stages, explicitly separated from completed work.
export const LAB_NOTES = [
  { label: 'LEARNING FOCUS', title: 'Container orchestration', text: 'Building familiarity with Kubernetes concepts and how they extend container workflows.', status: 'Learning' },
  { label: 'LEARNING FOCUS', title: 'Metrics & dashboards', text: 'Developing observability foundations with Prometheus and Grafana.', status: 'Learning' },
  { label: 'NEXT PLATFORM STEP', title: 'Harden the deployment', text: 'TLS, AWS WAF, and fuller observability are planned for the cloud platform; they are not implemented yet.', status: 'Planned' },
];
