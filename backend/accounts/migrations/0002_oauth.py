from django.db import migrations

def add_oauth_providers(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.filter(password=''):
        user.auth_provider = 'google'
        user.save()

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_oauth_providers),
    ]
