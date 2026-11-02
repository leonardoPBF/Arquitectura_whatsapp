import os
import unittest
from unittest.mock import Mock, patch
from rasa_sdk.executor import CollectingDispatcher
from actions.actions import ActionCancelOrder, ActionUpdateOrderStatus, ActionGetProductStock, ActionGetTopCustomers
from actions.api_client import ReadOnlyClient


class ActionSecurityTests(unittest.TestCase):
    def test_write_actions_never_call_backend(self):
        for action in (ActionCancelOrder(), ActionUpdateOrderStatus()):
            dispatcher = CollectingDispatcher()
            with patch('actions.api_client.requests.get') as http:
                action.run(dispatcher, Mock(), {})
                http.assert_not_called()
                self.assertIn('solo consulta', dispatcher.messages[0]['text'])

    def test_missing_product_requests_clarification(self):
        tracker = Mock(); tracker.get_slot.return_value = None
        dispatcher = CollectingDispatcher()
        with patch('actions.api_client.requests.get') as http:
            ActionGetProductStock().run(dispatcher, tracker, {})
            http.assert_not_called()
            self.assertIn('producto', dispatcher.messages[0]['text'])

    def test_populated_customer_id_is_supported(self):
        responses = [Mock(status_code=200, json=lambda: [{'_id': 'fixture', 'name': 'Fixture'}]),
                     Mock(status_code=200, json=lambda: [{'customerId': {'_id': 'fixture'}, 'totalAmount': 10}])]
        dispatcher = CollectingDispatcher()
        with patch('actions.actions.requests.get', side_effect=responses):
            ActionGetTopCustomers().run(dispatcher, Mock(), {})
            self.assertIn('Fixture', dispatcher.messages[0]['text'])

    @patch.dict(os.environ, {'RASA_ACTIONS_TOKEN': 'test-only-' * 8, 'API_BASE_URL': 'http://api:3000/api'})
    def test_credentials_deadlines_and_redirect_policy(self):
        response = Mock(status_code=200)
        response.iter_content.return_value = [b'[]']
        with patch('actions.api_client.requests.get', return_value=response) as http:
            ReadOnlyClient().get('http://api:3000/api/orders')
            self.assertEqual(http.call_args.kwargs['timeout'], (2, 5))
            self.assertFalse(http.call_args.kwargs['allow_redirects'])
            self.assertIn('x-service-token', http.call_args.kwargs['headers'])
            response.close.assert_called_once()

    @patch.dict(os.environ, {'RASA_ACTIONS_TOKEN': 'test-only-' * 8, 'API_BASE_URL': 'http://api:3000/api'})
    def test_untrusted_urls_and_identifiers_never_leave_process(self):
        with patch('actions.api_client.requests.get') as http:
            for url in ['http://other/api/orders', 'http://api:3000/api/customers/../../orders', 'http://api:3000/api/orders?admin=true']:
                with self.assertRaises(ValueError): ReadOnlyClient().get(url)
            http.assert_not_called()

    @patch.dict(os.environ, {'RASA_ACTIONS_TOKEN': '', 'API_BASE_URL': 'http://api:3000/api'})
    def test_missing_token_fails_closed(self):
        with patch('actions.api_client.requests.get') as http:
            with self.assertRaises(ValueError): ReadOnlyClient().get('http://api:3000/api/orders')
            http.assert_not_called()

    @patch.dict(os.environ, {'RASA_ACTIONS_TOKEN': 'test-only-' * 8, 'API_BASE_URL': 'http://api:3000/api'})
    def test_response_size_is_bounded(self):
        response = Mock(status_code=200)
        response.iter_content.return_value = [b'x' * (2 * 1024 * 1024 + 1)]
        with patch('actions.api_client.requests.get', return_value=response):
            with self.assertRaises(ValueError): ReadOnlyClient().get('http://api:3000/api/orders')
            response.close.assert_called_once()


if __name__ == '__main__':
    unittest.main()
