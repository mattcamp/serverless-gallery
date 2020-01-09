data "aws_region" "current" {}

resource "aws_cognito_user_pool" "gallery_admins_pool" {
  name = "gallery-admins"
  username_attributes = ["email"]

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  password_policy {
    require_symbols = false
    require_uppercase = true
    minimum_length = 6
  }

  verification_message_template {
    email_subject = "DEEPRACING.IO Gallery admin user activation"
  }
}

resource "aws_cognito_user_pool_client" "gallery_admin_client" {
  name = "gallery_admin_client"

  user_pool_id = aws_cognito_user_pool.gallery_admins_pool.id

  generate_secret     = false
  explicit_auth_flows = ["USER_PASSWORD_AUTH"]
}

resource "aws_cognito_identity_pool" "gallery_admins_id_pool" {
  identity_pool_name = "gallery admins identity pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id = aws_cognito_user_pool_client.gallery_admin_client.id
    provider_name = "cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.gallery_admins_pool.id}"
    server_side_token_check = false
  }
}

output "user_pool_id" {
  value = aws_cognito_user_pool.gallery_admins_pool.id
  description = "User pool ID"
}

output "app_client_id" {
  value = aws_cognito_user_pool_client.gallery_admin_client.id
  description = "App client ID"
}

output "identity_pool_id" {
  value = aws_cognito_identity_pool.gallery_admins_id_pool.id
  description = "Identity pool ID"
}