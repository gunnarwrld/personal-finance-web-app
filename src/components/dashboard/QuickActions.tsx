import { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TransactionModal } from '../transactions/TransactionModal';
import { AccountModal } from '../accounts/AccountModal';

export function QuickActions() {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() => setShowTransactionModal(true)}
            className="justify-center"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </Button>

          <Button
            onClick={() => setShowAccountModal(true)}
            variant="secondary"
            className="justify-center"
            size="lg"
          >
            <Wallet className="w-5 h-5 mr-2" />
            Add Account
          </Button>
        </div>
      </Card>

      {showTransactionModal && (
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
        />
      )}

      {showAccountModal && (
        <AccountModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
        />
      )}
    </>
  );
}
