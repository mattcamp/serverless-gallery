data "aws_iam_policy_document" "gallery_admin_authenticated" {
  statement {
    sid = "1"

    actions = [
      "mobileanalytics:PutEvents",
      "cognito-sync:*",
      "cognito-identity:*"
    ]

    resources = [
        "*",
    ]
  }

  statement {
    sid = "2"

    actions = [
      "dynamodb:*"
      ]

    resources = [
      aws_dynamodb_table.gallery-uploads-table.arn,
      aws_dynamodb_table.gallery-albums-table.arn,
      aws_dynamodb_table.gallery-images-table.arn,
    ]

  }

  statement {
    sid = "3"

    actions = [
      "lambda:InvokeFunction",
      "lambda:InvokeAsync"
    ]

    resources = [
      aws_lambda_function.galleryAdmin_lambda.arn
    ]

  }


}

resource "aws_iam_policy" "gallery_admin_authenticated_policy" {
  name   = "gallery_admin_authenticated_policy"
  path   = "/"
  policy = data.aws_iam_policy_document.gallery_admin_authenticated.json
}

resource "aws_iam_policy_attachment" "gallery_admin_authenticated_attach" {
  name       = "gallery_admin_authenticated_attach"
  roles      = [aws_iam_role.authenticated_role.name]
  policy_arn = aws_iam_policy.gallery_admin_authenticated_policy.arn
}