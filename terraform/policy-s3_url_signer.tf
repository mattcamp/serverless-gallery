data "aws_iam_policy_document" "s3_url_signer_policy" {
  statement {
    sid = "1"

    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:Scan",
      "dynamodb:Query",
      "dynamodb:UpdateItem"
    ]

    resources = [
      "arn:aws:dynamodb:*:*:table/${aws_dynamodb_table.gallery-uploads-table.name}"
    ]
  }

  statement {
    sid = "2"

    actions = [
      "s3:putObject"
    ]

    resources = [
      "arn:aws:s3:::${aws_s3_bucket.gallery-uploads.bucket}",
      "arn:aws:s3:::${aws_s3_bucket.gallery-uploads.bucket}/*"
    ]
  }

}

resource "aws_iam_policy" "s3_url_signer_policy" {
  name   = "s3_url_signer_policy"
  path   = "/"
  policy = data.aws_iam_policy_document.s3_url_signer_policy.json
}

resource "aws_iam_policy_attachment" "s3_url_signer_attach" {
  name       = "s3_url_signer_attach"
  roles      = [aws_iam_role.s3_url_signer_role.name]
  policy_arn = aws_iam_policy.s3_url_signer_policy.arn
}