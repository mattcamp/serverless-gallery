resource "aws_cloudwatch_log_group" "thumbnailsLogGroup" {
  name              = "/aws/lambda/${aws_lambda_function.thumbnails_lambda.function_name}"
  retention_in_days = 14
}

# See also the following AWS managed policy: AWSLambdaBasicExecutionRole
resource "aws_iam_policy" "thumbnails_logging_policy" {
  name = "thumbnails_lambda_logging"
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

resource "aws_iam_role_policy_attachment" "thumbnails_lambda_logs" {
  role = aws_iam_role.thumbnails_role.name
  policy_arn = aws_iam_policy.thumbnails_logging_policy.arn
}

resource "aws_lambda_function" "thumbnails_lambda" {
  filename      = "../lambda/thumbnail-lambda/lambda.zip"
  function_name = "gallery-thumbnails"
  role          = aws_iam_role.thumbnails_role.arn
  handler       = "index.handler"
  depends_on    = [aws_iam_role_policy_attachment.thumbnails_lambda_logs]

  source_code_hash = filebase64sha256("../lambda/thumbnail-lambda/lambda.zip")

  runtime = "nodejs8.10"
  timeout = 10
  memory_size = 256

}

resource "aws_lambda_permission" "s3_lambda_invoke_permission" {
  statement_id  = "s3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.thumbnails_lambda.function_name
  principal     = "s3.amazonaws.com"

  # The /*/*/* part allows invocation from any stage, method and resource path
  # within API Gateway REST API.
  source_arn = aws_s3_bucket.gallery-uploads.arn

}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.gallery-uploads.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.thumbnails_lambda.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "images/"
  }

}