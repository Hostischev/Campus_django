from django.http import JsonResponse
from .models import Room

def get_free_rooms(request):
    gender = request.GET.get('gender')
    rooms = Room.objects.filter(gender=gender, is_occupied=False)
    data = {
        'rooms': [{'id': r.id, 'name': r.name} for r in rooms]
    }
    return JsonResponse(data)
