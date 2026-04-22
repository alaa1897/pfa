output "ec2_public_ip" {
  description = "EC2 instance public IP"
  value       = aws_instance.main.public_ip
}

output "alb_dns_name" {
  description = "ALB public URL — use this to access the app"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.main.endpoint
}

output "elasticache_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "ecr_backend_url" {
  description = "ECR backend repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR frontend repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "s3_bucket_name" {
  description = "S3 bucket name for media files"
  value       = aws_s3_bucket.media.bucket
}