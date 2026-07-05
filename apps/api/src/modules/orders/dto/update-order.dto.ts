import { CreateOrderDto } from "./create-order.dto";

// Editing an order resends the full form (customer, items, date, payment
// status) rather than a partial patch — matches the original app's "edit
// reuses the create modal" UX, and lets the server recompute pricing from
// scratch every time so nothing drifts out of sync with the discount rules.
export class UpdateOrderDto extends CreateOrderDto {}
