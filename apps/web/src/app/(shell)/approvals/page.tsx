import { Card } from '@ramps/ui/Card';
import type { Metadata } from 'next';

import { ApprovalsWorkflow } from '@/features/approvals/components/ApprovalsWorkflow';

/**
 * /approvals — a demo surface for the Approvals workflow component
 * (…/snapshots/10-approvals-add-approver.jpeg).
 *
 * A Server Component that frames the interactive, mocked {@link ApprovalsWorkflow}
 * in the same "Approvals" card the bill-draft screen uses. The {@link ApprovalsWorkflow}
 * owns its own in-memory state and mocked roles/users catalog — no backend — so
 * this page just composes and titles it.
 */
export const metadata: Metadata = {
  title: 'Approvals — ramps',
  description: 'Compound an approval chain from roles and users.',
};

export default function ApprovalsPage() {
  return (
    <main className="bg-limestone p-rui-6 min-h-dvh">
      <div className="max-w-2xl mx-auto">
        <Card>
          <Card.Header>Approvals</Card.Header>
          <Card.Body>
            <ApprovalsWorkflow />
          </Card.Body>
        </Card>
      </div>
    </main>
  );
}
