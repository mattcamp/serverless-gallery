resource "aws_lambda_permission" "lambda_permission" {
  statement_id  = "Allows3UrlSignerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = "gallery-s3_url_signer"
  principal     = "apigateway.amazonaws.com"

  # The /*/*/* part allows invocation from any stage, method and resource path
  # within API Gateway REST API.
  source_arn = "${aws_api_gateway_rest_api.s3UrlSigner.execution_arn}/*/*/*"
}

resource "aws_cloudwatch_log_group" "s3UrlSignerLogGroup" {
  name              = "/aws/lambda/${aws_lambda_function.s3_url_signer_lambda.function_name}"
  retention_in_days = 14
}

# See also the following AWS managed policy: AWSLambdaBasicExecutionRole
resource "aws_iam_policy" "s3_url_signer_logging_policy" {
  name = "lambda_logging"
  path = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "s3_url_signer_lambda_logs" {
  role = aws_iam_role.s3_url_signer_role.name
  policy_arn = aws_iam_policy.s3_url_signer_logging_policy.arn
}

resource "aws_lambda_function" "s3_url_signer_lambda" {
  filename      = "../lambda/presigner/lambda.zip"
  function_name = "gallery-s3_url_signer"
  role          = aws_iam_role.s3_url_signer_role.arn
  handler       = "index.handler"
  depends_on    = [aws_iam_role_policy_attachment.s3_url_signer_lambda_logs]

  # The filebase64sha256() function is available in Terraform 0.11.12 and later
  # For Terraform 0.11.11 and earlier, use the base64sha256() function and the file() function:
  # source_code_hash = "${base64sha256(file("lambda_function_payload.zip"))}"
  source_code_hash = filebase64sha256("../lambda/presigner/lambda.zip")

  runtime = "nodejs12.x"

  environment {
    variables = {
      s3_bucket = aws_s3_bucket.gallery-uploads.bucket,
      uploads_table = aws_dynamodb_table.gallery-uploads-table.name
    }
  }
}