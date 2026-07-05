import type { Meta, StoryObj } from "@storybook/nextjs";
import { FileUpload, type UploadFileItem } from "./file-upload";

const meta: Meta<typeof FileUpload> = {
  title: "UI/FileUpload",
  component: FileUpload,
  args: {
    label: "Proof of delivery",
    helperText: "PDF, PNG, or JPG up to 10 MB",
    files: [],
    multiple: true,
  },
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

export const Idle: Story = {
  args: { files: [] },
};

export const DragOver: Story = {
  args: { files: [] },
  parameters: { pseudo: { hover: true } },
};

export const FileSelected: Story = {
  args: {
    files: [
      { id: "1", name: "manifest-4821.pdf", size: 245_000, status: "uploaded" },
    ] satisfies UploadFileItem[],
  },
};

export const Uploading: Story = {
  args: {
    files: [
      { id: "1", name: "invoice-9931.pdf", size: 512_000, status: "uploading", progress: 62 },
      { id: "2", name: "pod-signature.png", size: 88_000, status: "uploading", progress: 18 },
    ] satisfies UploadFileItem[],
  },
};

export const Uploaded: Story = {
  args: {
    files: [
      { id: "1", name: "customs-form-eu.pdf", size: 154_000, status: "uploaded" },
      { id: "2", name: "manifest-4821.pdf", size: 245_000, status: "uploaded" },
    ] satisfies UploadFileItem[],
  },
};

export const Failed: Story = {
  args: {
    files: [
      {
        id: "1",
        name: "damaged-goods-photo.heic",
        size: 3_400_000,
        status: "failed",
        errorMessage: "Unsupported file type. Convert to JPG or PNG and try again.",
      },
    ] satisfies UploadFileItem[],
  },
};

export const MixedStates: Story = {
  args: {
    files: [
      { id: "1", name: "manifest-4821.pdf", size: 245_000, status: "uploaded" },
      { id: "2", name: "invoice-9931.pdf", size: 512_000, status: "uploading", progress: 45 },
      {
        id: "3",
        name: "customs-form-eu.pdf",
        size: 154_000,
        status: "failed",
        errorMessage: "Upload timed out. Retry when your connection is stable.",
      },
    ] satisfies UploadFileItem[],
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    files: [{ id: "1", name: "manifest-4821.pdf", size: 245_000, status: "uploaded" }] satisfies UploadFileItem[],
  },
};

export const MultipleFilesDisabled: Story = {
  name: "Single file only",
  args: { multiple: false, files: [] },
};
