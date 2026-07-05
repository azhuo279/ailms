import type { Meta, StoryObj } from "@storybook/nextjs";
import { Accordion, AccordionItem } from "./accordion";

/**
 * **Accordion** — progressively discloses sections on a page to reduce
 * scrolling, especially in dense detail views and settings groups. Use for
 * show/hide sections, not hierarchy — for hierarchy, use Tree View.
 */
const meta: Meta<typeof Accordion> = {
  title: "UI/Accordion",
  component: Accordion,
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Collapsed: Story = {
  render: () => (
    <Accordion className="w-96">
      <AccordionItem id="shipment" title="Shipment details">
        Ground freight, 12 pallets, refrigerated.
      </AccordionItem>
      <AccordionItem id="carrier" title="Carrier information">
        Swift Line Logistics — DOT #884213.
      </AccordionItem>
      <AccordionItem id="documents" title="Documents">
        Bill of lading, customs form, proof of delivery.
      </AccordionItem>
    </Accordion>
  ),
};

export const Expanded: Story = {
  render: () => (
    <Accordion className="w-96" defaultOpenIds={["shipment"]}>
      <AccordionItem id="shipment" title="Shipment details">
        Ground freight, 12 pallets, refrigerated.
      </AccordionItem>
      <AccordionItem id="carrier" title="Carrier information">
        Swift Line Logistics — DOT #884213.
      </AccordionItem>
    </Accordion>
  ),
};

export const MultipleOpen: Story = {
  render: () => (
    <Accordion className="w-96" multiple defaultOpenIds={["shipment", "carrier"]}>
      <AccordionItem id="shipment" title="Shipment details">
        Ground freight, 12 pallets, refrigerated.
      </AccordionItem>
      <AccordionItem id="carrier" title="Carrier information">
        Swift Line Logistics — DOT #884213.
      </AccordionItem>
      <AccordionItem id="documents" title="Documents">
        Bill of lading, customs form, proof of delivery.
      </AccordionItem>
    </Accordion>
  ),
};

export const WithDisabledItem: Story = {
  render: () => (
    <Accordion className="w-96">
      <AccordionItem id="shipment" title="Shipment details">
        Ground freight, 12 pallets, refrigerated.
      </AccordionItem>
      <AccordionItem id="locked" title="Billing (locked)" disabled>
        Not visible in this role.
      </AccordionItem>
    </Accordion>
  ),
};

export const FocusVisible: Story = {
  render: () => (
    <Accordion className="w-96">
      <AccordionItem id="shipment" title="Shipment details">
        Ground freight, 12 pallets, refrigerated.
      </AccordionItem>
    </Accordion>
  ),
  parameters: { pseudo: { focusVisible: true } },
};
