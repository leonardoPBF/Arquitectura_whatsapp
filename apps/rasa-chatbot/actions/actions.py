from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import requests

API_BASE_URL = "http://localhost:3000/api/orders"

class ActionGetOrders(Action):
    def name(self) -> str:
        return "action_get_orders"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: dict):

        user_phone = tracker.get_slot("phone") or "123456789"  # temporal
        response = requests.get(f"{API_BASE_URL}/customer/{user_phone}")

        if response.status_code == 200:
            orders = response.json()
            if len(orders) > 0:
                dispatcher.utter_message(text=f"Tienes {len(orders)} órdenes registradas.")
            else:
                dispatcher.utter_message(text="No se encontraron órdenes activas.")
        else:
            dispatcher.utter_message(text="No pude obtener tus órdenes.")
        return []

class ActionGetOrderStatus(Action):
    def name(self) -> str:
        return "action_get_order_status"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: dict):
        order_id = tracker.get_slot("order_id")
        if not order_id:
            dispatcher.utter_message(text="Por favor, indícame el número de orden.")
            return []

        response = requests.get(f"{API_BASE_URL}/{order_id}")
        if response.status_code == 200:
            order = response.json()
            dispatcher.utter_message(text=f"El estado de la orden {order_id} es: {order['status']}.")
        else:
            dispatcher.utter_message(text="No encontré la orden que indicaste.")
        return []

class ActionCancelOrder(Action):
    def name(self) -> str:
        return "action_cancel_order"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: dict):
        order_id = tracker.get_slot("order_id")
        if not order_id:
            dispatcher.utter_message(text="Por favor, indícame el número de orden que deseas cancelar.")
            return []

        response = requests.post(f"{API_BASE_URL}/{order_id}/cancel")
        if response.status_code == 200:
            dispatcher.utter_message(text=f"La orden {order_id} fue cancelada con éxito.")
        else:
            dispatcher.utter_message(text="No se pudo cancelar la orden.")
        return []
