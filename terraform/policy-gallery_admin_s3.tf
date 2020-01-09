data "aws_iam_policy_document" "gallery_admin_s3_policy" {
  statement {
    sid = "1"

    actions = [
      "s3:*",
    ]

    resources = [
        "arn:aws:s3:::${aws_s3_bucket.gallery-uploads.bucket}",
        "arn:aws:s3:::${aws_s3_bucket.gallery-uploads.bucket}/*",
        "arn:aws:s3:::${aws_s3_bucket.gallery-public.bucket}",
        "arn:aws:s3:::${aws_s3_bucket.gallery-public.bucket}/*"
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

}

resource "aws_iam_policy" "gallery_admin_s3_policy" {
  name   = "gallery_admin_s3_policy"
  path   = "/"
  policy = data.aws_iam_policy_document.gallery_admin_s3_policy.json
}

resource "aws_iam_policy_attachment" "gallery_admin_s3_attach" {
  name       = "gallery_admin_s3_attach"
  roles      = [
    aws_iam_role.gallery_admin_lambda_role.name,
    aws_iam_role.authenticated_role.name
  ]
  policy_arn = aws_iam_policy.gallery_admin_s3_policy.arn
}