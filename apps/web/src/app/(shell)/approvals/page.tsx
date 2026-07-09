import { ApprovalsWorkflow } from '@ramps/ui/ApprovalsWorkflow';
import { Card } from '@ramps/ui/Card';
import type { Metadata } from 'next';

import {
  APPROVAL_ROLES,
  APPROVAL_USERS,
  INITIAL_APPROVAL_STAGES,
} from '@/features/approvals/constants/approvals.constants';

/**
 * /approvals — a demo surface for the design system's {@link ApprovalsWorkflow}
 * (…/snapshots/10-approvals-add-approver.jpeg).
 *
 * A Server Component that frames the interactive workflow in the same
 * "Approvals" card the bill-draft screen uses. The workflow itself lives in
 * `@ramps/ui`; this page only supplies the mocked roles/users catalog and the
 * starter chain as props — no backend.
 */
export const metadata: Metadata = {
  title: 'Approvals — Ramps',
  description: 'Compound an approval chain from roles and users.',
};

export default function ApprovalsPage() {
  return (
    <main className="bg-limestone p-rui-6 min-h-dvh">
      <div className="max-w-2xl mx-auto">
        <Card>
          <Card.Header>Approvals</Card.Header>
          <Card.Body>
            <ApprovalsWorkflow
              roles={APPROVAL_ROLES}
              users={APPROVAL_USERS}
              initialStages={INITIAL_APPROVAL_STAGES}
            />
          </Card.Body>
        </Card>
      </div>
    </main>
  );
}
