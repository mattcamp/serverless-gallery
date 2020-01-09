resource "aws_api_gateway_rest_api" "s3UrlSigner" {
  name        = "s3UrlSigner"
  description = "Generates presigned URLs for direct uploading to S3 buckets"
}

resource "aws_api_gateway_resource" "s3UrlSignerResource" {
  rest_api_id = aws_api_gateway_rest_api.s3UrlSigner.id
  parent_id   = aws_api_gateway_rest_api.s3UrlSigner.root_resource_id
  path_part   = "get_url"
}

resource "aws_api_gateway_method" "s3UrlSignerMethod" {
  rest_api_id   = aws_api_gateway_rest_api.s3UrlSigner.id
  resource_id   = aws_api_gateway_resource.s3UrlSignerResource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "options_method" {
    rest_api_id   = aws_api_gateway_rest_api.s3UrlSigner.id
    resource_id   = aws_api_gateway_resource.s3UrlSignerResource.id
    http_method   = "OPTIONS"
    authorization = "NONE"
}


resource "aws_api_gateway_integration" "s3UrlSignerIntegration" {
  rest_api_id             = aws_api_gateway_rest_api.s3UrlSigner.id
  resource_id             = aws_api_gateway_resource.s3UrlSignerResource.id
  http_method             = aws_api_gateway_method.s3UrlSignerMethod.http_method
  integration_http_method = "POST"
  type                    = "AWS"
  uri                     = aws_lambda_function.s3_url_signer_lambda.invoke_arn
}

resource "aws_api_gateway_integration" "options_integration" {
    rest_api_id   = aws_api_gateway_rest_api.s3UrlSigner.id
    resource_id   = aws_api_gateway_resource.s3UrlSignerResource.id
    http_method   = aws_api_gateway_method.options_method.http_method
    type          = "MOCK"
    depends_on = [aws_api_gateway_method.options_method]

    request_templates = { "application/json" = "{ \"statusCode\": 200   }" }
}

resource "aws_api_gateway_method_response" "response_200" {
  rest_api_id = aws_api_gateway_rest_api.s3UrlSigner.id
  resource_id = aws_api_gateway_resource.s3UrlSignerResource.id
  http_method = aws_api_gateway_method.s3UrlSignerMethod.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_method_response" "options_200" {
    rest_api_id   = aws_api_gateway_rest_api.s3UrlSigner.id
    resource_id   = aws_api_gateway_resource.s3UrlSignerResource.id
    http_method   = aws_api_gateway_method.options_method.http_method
    status_code   = "200"
    response_models = {
        "application/json" = "Empty"
    }
    response_parameters = {
        "method.response.header.Access-Control-Allow-Headers" = true,
        "method.response.header.Access-Control-Allow-Methods" = true,
        "method.response.header.Access-Control-Allow-Origin" = true
    }
    depends_on = [aws_api_gateway_method.options_method]
}

resource "aws_api_gateway_integration_response" "s3UrlSignerIntegrationResponse" {
  rest_api_id = aws_api_gateway_rest_api.s3UrlSigner.id
  resource_id = aws_api_gateway_resource.s3UrlSignerResource.id
  http_method = aws_api_gateway_method.s3UrlSignerMethod.http_method
  status_code = aws_api_gateway_method_response.response_200.status_code
  depends_on = [aws_api_gateway_integration.s3UrlSignerIntegration]
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
    rest_api_id   = aws_api_gateway_rest_api.s3UrlSigner.id
    resource_id   = aws_api_gateway_resource.s3UrlSignerResource.id
    http_method   = aws_api_gateway_method.options_method.http_method
    status_code   = aws_api_gateway_method_response.options_200.status_code
    response_parameters = {
        "method.response.header.Access-Control-Allow-Headers" = "'Content-Type'",
        "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'",
        "method.response.header.Access-Control-Allow-Origin" = "'*'"
    }

    depends_on = [aws_api_gateway_method_response.options_200]
}


resource "aws_api_gateway_deployment" "s3UrlSignerDeployment" {
  depends_on = [aws_api_gateway_integration.s3UrlSignerIntegration, aws_api_gateway_integration_response.s3UrlSignerIntegrationResponse]
  rest_api_id = aws_api_gateway_rest_api.s3UrlSigner.id
  stage_name  = "live"
}

output "s3_url_signer_url" {
  value = "${aws_api_gateway_deployment.s3UrlSignerDeployment.invoke_url}/${aws_api_gateway_resource.s3UrlSignerResource.path_part}"
  description = "Gallery admin URL base"
}