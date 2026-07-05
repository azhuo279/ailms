import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Pagination } from "./pagination";

/**
 * **Pagination** — for content intentionally chunked across pages,
 * especially dense tables or long search results. Do not use for sequential
 * step journeys; use Progress Tracker instead.
 */
const meta: Meta<typeof Pagination> = {
  title: "UI/Pagination",
  component: Pagination,
};

export default meta;
type Story = StoryObj<typeof Pagination>;

function Controlled(props: Partial<React.ComponentProps<typeof Pagination>>) {
  const [page, setPage] = useState(props.currentPage ?? 1);
  return (
    <Pagination
      totalPages={12}
      {...props}
      currentPage={props.currentPage ?? page}
      onPageChange={(p) => {
        setPage(p);
        props.onPageChange?.(p);
      }}
    />
  );
}

export const Default: Story = { render: () => <Controlled currentPage={1} /> };

export const MiddlePage: Story = { render: () => <Controlled currentPage={6} /> };

export const LastPage: Story = { render: () => <Controlled currentPage={12} /> };

export const WithFirstLast: Story = { render: () => <Controlled currentPage={6} showFirstLast /> };

export const WithPageSizeAndSummary: Story = {
  render: () => {
    function Wrapper() {
      const [page, setPage] = useState(2);
      const [pageSize, setPageSize] = useState(25);
      return (
        <Pagination
          currentPage={page}
          totalPages={20}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={487}
        />
      );
    }
    return <Wrapper />;
  },
};

export const FewPages: Story = { render: () => <Controlled currentPage={2} totalPages={3} /> };

export const SinglePage: Story = {
  render: () => <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
};

export const FocusVisible: Story = {
  render: () => <Controlled currentPage={1} />,
  parameters: { pseudo: { focusVisible: true } },
};
