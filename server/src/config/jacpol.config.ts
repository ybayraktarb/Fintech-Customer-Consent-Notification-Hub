import {
  MemoryAdapter,
  PolicyEvaluator,
  PrpService,
  PdpService,
} from '@rubiklabs/nestjs-jacpol';


export const customerAuditPolicySet = {
  id: 'customer-audit-policy-set',
  target: { 'resource.type': { equalsTo: 'customer_audit' } },
  algorithm: 'denyOverrides' as const,
  policies: [
    {
      id: 'admin-auditor-policy',
      target: { 'subject.role': { in: ['admin', 'auditor'] } },
      algorithm: 'permitOverrides' as const,
      rules: [
        {
          id: 'admin-auditor-full-access',
          effect: 'permit' as const,
        },
      ],
    },
    {
      id: 'staff-policy',
      target: { 'subject.role': { in: ['staff', 'user'] } },
      algorithm: 'firstApplicable' as const,
      rules: [
        {
          id: 'block-weekend-access',
          condition: {
            'environment.weekday': { in: ['saturday', 'sunday'] },
          },
          effect: 'deny' as const,
          priority: 10,
        },
        {
          id: 'allow-business-hours',
          condition: {
            'environment.time': { between: '09:00 18:00' },
          },
          effect: 'permit' as const,
        },
      ],
    },
  ],
};


const adapter = new MemoryAdapter();

adapter.savePolicySet(customerAuditPolicySet);

export const prpService = new PrpService(adapter, { ttlMs: 30_000 });
export const policyEvaluator = new PolicyEvaluator();
export const pdpService = new PdpService(prpService, policyEvaluator, {
  defaultDecision: 'deny',
});
