import { motion, AnimatePresence } from 'framer-motion';
import { RoleBasedWrapper } from './RoleBasedWrapper';

type RoleSpecificContentProps = {
  admin?: React.ReactNode;
  merchant?: React.ReactNode;
  customer?: React.ReactNode;
  fallback?: React.ReactNode;
};

export function RoleSpecificContent({
  admin,
  merchant,
  customer,
  fallback = null
}: RoleSpecificContentProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <RoleBasedWrapper allowedRoles={['admin']}>
          {admin}
        </RoleBasedWrapper>
        <RoleBasedWrapper allowedRoles={['merchant']}>
          {merchant}
        </RoleBasedWrapper>
        <RoleBasedWrapper allowedRoles={['customer']}>
          {customer}
        </RoleBasedWrapper>
      </motion.div>
    </AnimatePresence>
  );
}
