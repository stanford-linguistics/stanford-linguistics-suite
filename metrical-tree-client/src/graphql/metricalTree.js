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
        name
        description
        unstressed_words
        unstressed_tags
        unstressed_deps
        ambiguous_words
        ambiguous_tags
        ambiguous_deps
        stressed_words
      }
      status
    }
  }
`;

export const GET_RESULT_FOR_SINGLE_COMPUTE = gql`
  query GetSingleComputeResult($id: string!) {
    result(id: $id)
      @rest(type: "Result", path: "/metrical-tree-results/{args.id}") {
      id
      errorMessage
      errorDetails {
        message
        error_code
        category
        category_description
        severity
        suggestion
        details
      }
      error
      link
      status
      data
      analysis
      sentences
      dataUrl
      expiresIn
      expiresOn
      createdOn
      isReliableState
      stateReliability
      stateDetails {
        resolutionMethod
        artifactsFound
        message
        reconstruction
      }
      isLargeDataset
      dataSize
    }
  }
`;
