-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.** { *; }
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses,EnclosingMethod

# Room
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *

# Hilt
-keep class dagger.hilt.** { *; }
-keep @dagger.hilt.android.lifecycle.HiltViewModel class * { *; }

# Gson
-keepattributes Signature
-keep class com.poseguide.ai.data.pose.**Dto { *; }
