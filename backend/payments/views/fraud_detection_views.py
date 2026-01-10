"""
Fraud Detection API Views
Provides endpoints for fraud detection and monitoring
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from payments.services.fraud_detection_ml_service import MLFraudDetectionService, BehavioralAnalysisService
from payments.models import Transaction
from django.db.models import Count, Sum


class FraudDetectionViewSet(viewsets.ViewSet):
    """
    Fraud detection and analysis API endpoints
    """
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def analyze_transaction(self, request, pk=None):
        """
        Analyze a specific transaction for fraud
        """
        try:
            transaction = Transaction.objects.get(id=pk)
            fraud_service = MLFraudDetectionService()

            analysis_result = fraud_service.analyze_transaction(transaction)

            return Response(analysis_result)

        except Transaction.DoesNotExist:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Fraud analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def fraud_statistics(self, request):
        """
        Get fraud detection statistics
        Query params:
        - days: Analysis period in days (default: 30)
        """
        try:
            days = int(request.query_params.get('days', 30))
            fraud_service = MLFraudDetectionService()

            stats = fraud_service.get_fraud_statistics(days)

            # Get additional statistics from database
            end_date = timezone.now()
            start_date = end_date - timezone.timedelta(days=days)

            db_stats = Transaction.objects.filter(
                created_at__gte=start_date
            ).aggregate(
                total_transactions=Count('id'),
                flagged_transactions=Count('id', filter=Q(status='pending')),  # Simplified
                blocked_transactions=Count('id', filter=Q(status='failed'))
            )

            return Response({
                'period_days': days,
                'ml_statistics': stats,
                'database_statistics': db_stats,
                'timestamp': end_date.isoformat()
            })

        except Exception as e:
            return Response(
                {'error': f'Failed to fetch fraud statistics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def update_fraud_model(self, request):
        """
        Update fraud detection model with feedback
        Request body:
        - transaction_id: Transaction ID
        - is_fraud: Boolean indicating if transaction was fraudulent
        """
        try:
            transaction_id = request.data.get('transaction_id')
            is_fraud = request.data.get('is_fraud')

            if not transaction_id or is_fraud is None:
                return Response(
                    {'error': 'transaction_id and is_fraud are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            fraud_service = MLFraudDetectionService()
            fraud_service.update_model_with_feedback(transaction_id, bool(is_fraud))

            return Response({
                'message': 'Fraud model updated successfully',
                'transaction_id': transaction_id,
                'feedback': 'fraud' if is_fraud else 'legitimate'
            })

        except Exception as e:
            return Response(
                {'error': f'Model update failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def high_risk_transactions(self, request):
        """
        Get list of high-risk transactions requiring review
        Query params:
        - days: Lookback period (default: 7)
        - limit: Maximum results (default: 50)
        """
        try:
            days = int(request.query_params.get('days', 7))
            limit = int(request.query_params.get('limit', 50))

            end_date = timezone.now()
            start_date = end_date - timezone.timedelta(days=days)

            # Get transactions that might be high-risk
            # This is simplified - in production you'd have a fraud_score field
            high_risk_transactions = Transaction.objects.filter(
                created_at__gte=start_date,
                amount__gte=1000  # High amount threshold
            ).select_related('customer__user', 'payment_method').order_by('-created_at')[:limit]

            results = []
            fraud_service = MLFraudDetectionService()

            for transaction in high_risk_transactions:
                analysis = fraud_service.analyze_transaction(transaction)
                results.append({
                    'transaction_id': transaction.id,
                    'amount': float(transaction.amount),
                    'currency': transaction.currency,
                    'customer': transaction.customer.user.email,
                    'payment_method': transaction.payment_method.method_type,
                    'created_at': transaction.created_at.isoformat(),
                    'fraud_analysis': analysis
                })

            return Response({
                'total_results': len(results),
                'period_days': days,
                'transactions': results
            })

        except Exception as e:
            return Response(
                {'error': f'Failed to fetch high-risk transactions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def behavioral_analysis(self, request, pk=None):
        """
        Perform behavioral analysis on a user
        URL param: user_id
        """
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()

            user = User.objects.get(id=pk)
            behavioral_service = BehavioralAnalysisService()

            # Get recent transaction for analysis
            recent_transaction = user.customer.customer_transactions.filter(
                status='completed'
            ).order_by('-created_at').first()

            if not recent_transaction:
                return Response({
                    'user_id': pk,
                    'message': 'No recent transactions found for analysis'
                })

            analysis = behavioral_service.analyze_user_behavior(user, recent_transaction)

            return Response(analysis)

        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Behavioral analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FraudMonitoringViewSet(viewsets.ViewSet):
    """
    Real-time fraud monitoring and alerting
    """
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """
        Get active fraud alerts
        """
        try:
            # This would query a fraud alerts table in production
            # For now, return mock alerts
            alerts = [
                {
                    'id': 'alert_001',
                    'type': 'high_risk_transaction',
                    'severity': 'high',
                    'message': 'Transaction amount significantly above user average',
                    'transaction_id': 'txn_123',
                    'user_id': 'user_456',
                    'timestamp': timezone.now().isoformat(),
                    'status': 'active'
                },
                {
                    'id': 'alert_002',
                    'type': 'unusual_frequency',
                    'severity': 'medium',
                    'message': 'Unusual transaction frequency detected',
                    'user_id': 'user_789',
                    'timestamp': (timezone.now() - timezone.timedelta(minutes=30)).isoformat(),
                    'status': 'active'
                }
            ]

            return Response({
                'alerts': alerts,
                'total_active': len(alerts),
                'timestamp': timezone.now().isoformat()
            })

        except Exception as e:
            return Response(
                {'error': f'Failed to fetch alerts: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def resolve_alert(self, request, pk=None):
        """
        Resolve a fraud alert
        Request body:
        - resolution: 'approved', 'rejected', 'investigating'
        - notes: Optional resolution notes
        """
        try:
            resolution = request.data.get('resolution')
            notes = request.data.get('notes', '')

            if resolution not in ['approved', 'rejected', 'investigating']:
                return Response(
                    {'error': 'Invalid resolution type'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # In production, this would update the alert status in database
            logger.info(f"Alert {pk} resolved: {resolution} - {notes}")

            return Response({
                'alert_id': pk,
                'resolution': resolution,
                'notes': notes,
                'resolved_at': timezone.now().isoformat(),
                'resolved_by': request.user.id
            })

        except Exception as e:
            return Response(
                {'error': f'Alert resolution failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def risk_dashboard(self, request):
        """
        Get comprehensive risk dashboard data
        """
        try:
            # Aggregate risk metrics
            end_date = timezone.now()
            start_date = end_date - timezone.timedelta(days=7)

            # Transaction risk metrics
            transactions = Transaction.objects.filter(created_at__gte=start_date)

            risk_metrics = {
                'total_transactions': transactions.count(),
                'high_amount_transactions': transactions.filter(amount__gte=1000).count(),
                'failed_transactions': transactions.filter(status='failed').count(),
                'pending_reviews': transactions.filter(status='pending').count(),
                'risk_trends': self._calculate_risk_trends(start_date, end_date)
            }

            # Geographic risk (placeholder)
            geographic_risk = {
                'high_risk_regions': [],  # To be implemented with real geographic risk data
                'suspicious_locations': 0  # To be calculated from transaction data
            }

            # Time-based risk
            time_risk = {
                'peak_risk_hours': [2, 3, 4, 5],  # 2-5 AM
                'weekend_risk_multiplier': 1.3
            }

            return Response({
                'risk_metrics': risk_metrics,
                'geographic_risk': geographic_risk,
                'time_risk': time_risk,
                'overall_risk_score': self._calculate_overall_risk_score(risk_metrics),
                'recommendations': self._generate_risk_recommendations(risk_metrics)
            })

        except Exception as e:
            return Response(
                {'error': f'Risk dashboard failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _calculate_risk_trends(self, start_date, end_date):
        """Calculate risk trends over time"""
        # Placeholder implementation
        return [
            {'date': (start_date + timezone.timedelta(days=i)).date().isoformat(),
             'risk_score': 0.3 + (i * 0.02)}  # Increasing risk over time
            for i in range(7)
        ]

    def _calculate_overall_risk_score(self, risk_metrics):
        """Calculate overall risk score"""
        try:
            total_txns = risk_metrics['total_transactions']
            if total_txns == 0:
                return 0.0

            # Weighted risk calculation
            high_amount_ratio = risk_metrics['high_amount_transactions'] / total_txns
            failed_ratio = risk_metrics['failed_transactions'] / total_txns
            pending_ratio = risk_metrics['pending_reviews'] / total_txns

            risk_score = (high_amount_ratio * 0.4) + (failed_ratio * 0.4) + (pending_ratio * 0.2)
            return min(risk_score, 1.0)

        except Exception:
            return 0.5

    def _generate_risk_recommendations(self, risk_metrics):
        """Generate risk mitigation recommendations"""
        recommendations = []

        if risk_metrics['failed_transactions'] > risk_metrics['total_transactions'] * 0.05:
            recommendations.append("High failure rate detected. Review payment processing.")

        if risk_metrics['high_amount_transactions'] > risk_metrics['total_transactions'] * 0.1:
            recommendations.append("Large number of high-value transactions. Consider enhanced monitoring.")

        if risk_metrics['pending_reviews'] > 10:
            recommendations.append("Multiple transactions pending review. Consider additional review staff.")

        if not recommendations:
            recommendations.append("Risk levels appear normal.")

        return recommendations
