import { describe, expect, test } from "bun:test";
import {
  dtoToModel,
  NewPostCommentDtoSchema,
} from "../../../src/models/events/new-post-comment";

describe("NewPostCommentDtoSchema", () => {
  test("should retain commentId through validation without commentContent", () => {
    const payload = {
      commentId: "11111111-1111-4111-8111-111111111111",
      postId: "22222222-2222-4222-8222-222222222222",
      postAuthorId: "33333333-3333-4333-8333-333333333333",
      commentAuthorId: "44444444-4444-4444-8444-444444444444",
      parentCommentId: null,
      parentCommentAuthorId: null,
      wasRead: false,
    };

    const parsed = NewPostCommentDtoSchema.parse(payload);

    expect(parsed.commentId).toBe(payload.commentId);
    expect("commentContent" in parsed).toBe(false);
  });

  test("should strip commentContent if present in the payload", () => {
    const payload = {
      commentId: "11111111-1111-4111-8111-111111111111",
      postId: "22222222-2222-4222-8222-222222222222",
      postAuthorId: "33333333-3333-4333-8333-333333333333",
      commentAuthorId: "44444444-4444-4444-8444-444444444444",
      commentContent: "stale copy that should not be persisted",
      wasRead: false,
    };

    const parsed = NewPostCommentDtoSchema.parse(payload);

    expect("commentContent" in parsed).toBe(false);
  });

  test("should reject payloads missing commentId", () => {
    const payload = {
      postId: "22222222-2222-4222-8222-222222222222",
      postAuthorId: "33333333-3333-4333-8333-333333333333",
      commentAuthorId: "44444444-4444-4444-8444-444444444444",
      wasRead: false,
    };

    const result = NewPostCommentDtoSchema.safeParse(payload);

    expect(result.success).toBe(false);
  });
});

describe("dtoToModel", () => {
  test("should map commentId onto the persistence model without commentContent", () => {
    const dto = {
      commentId: "11111111-1111-4111-8111-111111111111",
      postId: "22222222-2222-4222-8222-222222222222",
      postAuthorId: "33333333-3333-4333-8333-333333333333",
      commentAuthorId: "44444444-4444-4444-8444-444444444444",
      wasRead: false,
    };

    const model = dtoToModel(dto);

    expect(model.commentId?.toString()).toBe(dto.commentId);
    expect("commentContent" in model).toBe(false);
  });
});
