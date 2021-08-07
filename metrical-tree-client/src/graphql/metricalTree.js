import { gql } from '@apollo/client';

export const UPLOAD_METRICAL_TREE_FILE = gql`
  mutation UploadMetricalTreeFile($file: File!) {
    upload(file: $file)
      @rest(
        method: "POST"
        type: "Upload"
        path: "/uploads/metricaltree"
        bodySerializer: "fileEncode"
        bodyKey: "file"
      ) {
      id
      filename
      TTLSeconds
    }
  }
`;

export const COMPUTE_METRICAL_TREE_FILE = gql`
  mutation ComputeMetricalTreeFile(
    $id: string!
    $options: ComputeOptions
  ) {
    compute(id: $id, options: $options)
      @rest(
        method: "POST"
        type: "Compute"
        path: "/metricaltree/{args.id}"
        bodyKey: "options"
      ) {
      id
      description
      errorMessage
      link
      name
      params {
        description
        name
        unstressed_words
      }
      status
    }
  }
`;

export const GET_RESULT_FOR_SINGLE_COMPUTE = gql`
  query GetSingleComputeResult($id: string!) {
    result(id: $id)
      @rest(type: "Result", path: "/results/{args.id}") {
      id
      errorMessage
      link
      status
      data
      dataUrl
      expiresIn
      expiresOn
    }
  }
`;
